import logging
import json
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.models import Document, DocumentChunk
from backend.app.services.embedding_service import embedding_service
from backend.app.utils.chunking import TextChunker
from backend.app.config import settings

logger = logging.getLogger(__name__)

class RetrievalService:
    def __init__(self):
        self.embedding_service = embedding_service

    def index_pending_documents(self, db: Session) -> int:
        """Indexes all documents that do not have chunks yet using high-speed batching."""
        docs = db.query(Document).all()
        docs_to_index = []
        for doc in docs:
            existing = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).first()
            if not existing:
                docs_to_index.append(doc)

        if not docs_to_index:
            return 0

        # Prepare all doc preview texts and all chunks in one unified list for batch embedding
        doc_preview_texts = [d.title + "\n" + d.text_content[:500] for d in docs_to_index]
        all_chunks_data = []  # list of (doc, chunk_index, chunk_text)
        for doc in docs_to_index:
            chunks = TextChunker.chunk_text(doc.text_content, chunk_size=300, chunk_overlap=40)
            if not chunks:
                chunks = [doc.text_content]
            for i, c_text in enumerate(chunks):
                all_chunks_data.append((doc, i, c_text))

        # Batch embed doc previews
        logger.info(f"Embedding {len(doc_preview_texts)} document summaries...")
        doc_embeddings = self.embedding_service.embed_batch(doc_preview_texts)
        for doc, emb in zip(docs_to_index, doc_embeddings):
            doc.embedding = emb

        # Batch embed all chunks
        logger.info(f"Embedding {len(all_chunks_data)} document chunks in batch...")
        chunk_texts = [item[2] for item in all_chunks_data]
        chunk_embeddings = self.embedding_service.embed_batch(chunk_texts)

        for (doc, chunk_idx, chunk_text), emb in zip(all_chunks_data, chunk_embeddings):
            chunk_record = DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk_idx,
                chunk_text=chunk_text,
                embedding=emb,
                metadata_json={
                    "source": doc.source_name,
                    "title": doc.title,
                    "url": doc.original_url,
                    "doc_type": doc.doc_type,
                    **(doc.metadata_json or {})
                }
            )
            db.add(chunk_record)

        db.commit()
        logger.info(f"RetrievalService: Successfully batch indexed {len(docs_to_index)} documents ({len(all_chunks_data)} chunks).")
        return len(docs_to_index)

    def search_similar_chunks(
        self,
        db: Session,
        query: str,
        source_filter: str = "all",
        top_k: int = 6,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        threshold = similarity_threshold if similarity_threshold is not None else settings.SIMILARITY_THRESHOLD

        # Smart intent override: if query explicitly mentions or compares sources, adjust effective filter
        effective_source = source_filter
        q_lower = query.lower()
        if "compare" in q_lower or ("darglobal" in q_lower and "wasalt" in q_lower) or ("dar global" in q_lower and "wasalt" in q_lower):
            effective_source = "all"
        elif ("darglobal" in q_lower or "dar global" in q_lower) and source_filter and "wasalt" in source_filter.lower():
            effective_source = "all"
        elif "wasalt" in q_lower and source_filter and "dar" in source_filter.lower():
            effective_source = "all"

        query_vector = self.embedding_service.embed_text(query)
        q_norm = np.array(query_vector, dtype=np.float32)
        norm_val = np.linalg.norm(q_norm)
        if norm_val > 0:
            q_norm = q_norm / norm_val

        is_postgres = db.bind.dialect.name == "postgresql"

        # Check if we can run native pgvector query
        if is_postgres:
            try:
                # Cosine distance: 1 - cosine_similarity. Distance <= (1 - threshold)
                source_condition = ""
                params = {"q_vec": str(query_vector), "limit": top_k * 2}
                if effective_source and effective_source.lower() not in ("all", "both"):
                    if "dar" in effective_source.lower():
                        source_condition = "AND d.source_name = 'DarGlobal'"
                    elif "wasalt" in effective_source.lower():
                        source_condition = "AND d.source_name = 'Wasalt'"

                query_sql = f"""
                    SELECT 
                        c.id as chunk_id,
                        d.id as doc_id,
                        d.title,
                        d.source_name,
                        d.original_url,
                        c.chunk_text,
                        1 - (c.embedding <=> :q_vec::vector) as similarity,
                        c.metadata_json
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    WHERE c.embedding IS NOT NULL {source_condition}
                    ORDER BY c.embedding <=> :q_vec::vector ASC
                    LIMIT :limit
                """
                res = db.execute(text(query_sql), params).fetchall()
                results = []
                for row in res:
                    sim = float(row.similarity)
                    if sim >= threshold:
                        results.append({
                            "chunk_id": row.chunk_id,
                            "document_id": row.doc_id,
                            "title": row.title,
                            "source": row.source_name,
                            "url": row.original_url,
                            "text": row.chunk_text,
                            "relevance_score": round(sim, 3),
                            "metadata": row.metadata_json
                        })
                if results:
                    return results[:top_k]
            except Exception as e:
                logger.warning(f"PostgreSQL pgvector query failed or extension missing: {e}. Falling back to Python similarity search.")

        # Python cosine similarity fallback (for SQLite or non-pgvector environments)
        query_obj = db.query(DocumentChunk, Document).join(Document, DocumentChunk.document_id == Document.id)
        if effective_source and effective_source.lower() not in ("all", "both"):
            if "dar" in effective_source.lower():
                query_obj = query_obj.filter(Document.source_name == "DarGlobal")
            elif "wasalt" in effective_source.lower():
                query_obj = query_obj.filter(Document.source_name == "Wasalt")

        all_chunks = query_obj.all()
        scored_chunks = []
        fallback_chunks = []

        for chunk, doc in all_chunks:
            emb = chunk.embedding
            if not emb:
                continue
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    continue

            emb_arr = np.array(emb, dtype=np.float32)
            denom = np.linalg.norm(emb_arr) * norm_val
            if denom == 0:
                continue
            cos_sim = float(np.dot(q_norm, emb_arr) / (np.linalg.norm(emb_arr)))

            # City & property relevance boost for targeted queries
            effective_score = cos_sim
            q_words = set(q_lower.split())
            doc_text_lower = (doc.title + " " + chunk.chunk_text).lower()

            for city in ("riyadh", "dubai", "jeddah", "muscat", "london", "makkah"):
                if city in q_words and city in doc_text_lower:
                    effective_score += 0.04
                    break

            if any(w in q_words for w in ("villa", "villas", "apartment", "apartments", "find", "show", "sale", "buy", "rent")):
                if doc.doc_type in ("property", "project"):
                    effective_score += 0.05
                    if "sale" in doc_text_lower:
                        effective_score += 0.03

            cand = {
                "chunk_id": chunk.id,
                "document_id": doc.id,
                "title": doc.title,
                "source": doc.source_name,
                "url": doc.original_url,
                "text": chunk.chunk_text,
                "relevance_score": round(effective_score, 3),
                "metadata": chunk.metadata_json
            }
            if cos_sim >= threshold:
                scored_chunks.append(cand)
            elif cos_sim >= 0.15 and similarity_threshold is None:
                fallback_chunks.append(cand)

        if not scored_chunks and fallback_chunks and similarity_threshold is None:
            fallback_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
            return fallback_chunks[:top_k]

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_chunks[:top_k]

retrieval_service = RetrievalService()
