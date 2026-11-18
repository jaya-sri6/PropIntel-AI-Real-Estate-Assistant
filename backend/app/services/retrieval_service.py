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

    async def index_pending_documents(self, db: Session) -> int:
        """Indexes all documents that do not have chunks yet."""
        docs = db.query(Document).all()
        indexed_count = 0

        for doc in docs:
            # Check if document already has chunks
            existing_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
            if existing_chunks > 0:
                continue

            # Embed document itself
            doc.embedding = self.embedding_service.embed_text(doc.title + "\n" + doc.text_content[:500])

            # Chunk text
            chunks = TextChunker.chunk_text(doc.text_content, chunk_size=300, chunk_overlap=40)
            if not chunks:
                chunks = [doc.text_content]

            chunk_embeddings = self.embedding_service.embed_batch(chunks)

            for i, (chunk_text, emb) in enumerate(zip(chunks, chunk_embeddings)):
                chunk_record = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
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

            indexed_count += 1

        db.commit()
        logger.info(f"RetrievalService: Indexed {indexed_count} new documents into chunks.")
        return indexed_count

    def search_similar_chunks(
        self,
        db: Session,
        query: str,
        source_filter: str = "all",
        top_k: int = 6,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        threshold = similarity_threshold if similarity_threshold is not None else settings.SIMILARITY_THRESHOLD
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
                if source_filter and source_filter.lower() not in ("all", "both"):
                    if "dar" in source_filter.lower():
                        source_condition = "AND d.source_name = 'DarGlobal'"
                    elif "wasalt" in source_filter.lower():
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
        if source_filter and source_filter.lower() not in ("all", "both"):
            if "dar" in source_filter.lower():
                query_obj = query_obj.filter(Document.source_name == "DarGlobal")
            elif "wasalt" in source_filter.lower():
                query_obj = query_obj.filter(Document.source_name == "Wasalt")

        all_chunks = query_obj.all()
        scored_chunks = []

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

            if cos_sim >= threshold:
                scored_chunks.append({
                    "chunk_id": chunk.id,
                    "document_id": doc.id,
                    "title": doc.title,
                    "source": doc.source_name,
                    "url": doc.original_url,
                    "text": chunk.chunk_text,
                    "relevance_score": round(cos_sim, 3),
                    "metadata": chunk.metadata_json
                })

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_chunks[:top_k]

retrieval_service = RetrievalService()
