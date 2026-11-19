"""
retrieval_service.py – Hybrid SQL + Vector retrieval for PropIntel AI
======================================================================

Strategy
--------
1. Always run SQL retrieval first (zero dependency on embedding model).
2. If the embedding model is loaded, also run vector/cosine retrieval.
3. Merge both result sets, deduplicate, and return the top-K records.

This guarantees that the chatbot returns real data from the production
database even when the SentenceTransformer model cannot be loaded on
Render (network-restricted / cold cache).
"""

import logging
import json
import re
from typing import List, Dict, Any, Optional

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text, or_, and_

from backend.app.models.document import Document
from backend.app.models.document_chunk import DocumentChunk
from backend.app.models.property import Property
from backend.app.models.project import Project
from backend.app.services.embedding_service import embedding_service
from backend.app.utils.chunking import TextChunker
from backend.app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Keyword dictionaries for query parsing
# ---------------------------------------------------------------------------

CITY_KEYWORDS = {
    "riyadh": "Riyadh",
    "jeddah": "Jeddah",
    "makkah": "Makkah",
    "mecca": "Makkah",
    "dubai": "Dubai",
    "abu dhabi": "Abu Dhabi",
    "abudhabi": "Abu Dhabi",
    "muscat": "Muscat",
    "london": "London",
    "miami": "Miami",
    "new york": "New York",
    "newyork": "New York",
    "istanbul": "Istanbul",
    "cairo": "Cairo",
    "medina": "Medina",
    "madinah": "Medina",
    "khobar": "Al Khobar",
    "dammam": "Dammam",
}

TYPE_KEYWORDS = {
    "villa": "Villa",
    "villas": "Villa",
    "apartment": "Apartment",
    "apartments": "Apartment",
    "flat": "Apartment",
    "penthouse": "Penthouse",
    "townhouse": "Townhouse",
    "studio": "Studio",
    "duplex": "Duplex",
    "mansion": "Villa",
}

SOURCE_ALIASES = {
    "darglobal": "DarGlobal",
    "dar global": "DarGlobal",
    "dar": "DarGlobal",
    "wasalt": "Wasalt",
}


# ---------------------------------------------------------------------------
# Query intent parser
# ---------------------------------------------------------------------------

def _parse_query_intent(query: str) -> Dict[str, Any]:
    """Extract structured intent from a free-text real estate query."""
    q = query.lower()

    intent: Dict[str, Any] = {
        "cities": [],
        "property_types": [],
        "source": None,
        "min_price": None,
        "max_price": None,
        "bedrooms": None,
        "bathrooms": None,
        "sale_or_rent": None,
        "want_projects": False,
        "want_properties": True,
    }

    # Cities
    for kw, canonical in CITY_KEYWORDS.items():
        if kw in q:
            if canonical not in intent["cities"]:
                intent["cities"].append(canonical)

    # Property types
    for kw, canonical in TYPE_KEYWORDS.items():
        if kw in q and canonical not in intent["property_types"]:
            intent["property_types"].append(canonical)

    # Source
    for kw, canonical in SOURCE_ALIASES.items():
        if kw in q:
            intent["source"] = canonical
            break

    # Sale / rent
    if any(w in q for w in ("for rent", "rental", "rent")):
        intent["sale_or_rent"] = "rent"
    elif any(w in q for w in ("for sale", "buy", "purchase", "sale")):
        intent["sale_or_rent"] = "sale"

    # Bedrooms
    bed_match = re.search(r"(\d+)\s*(?:bed(?:room)?s?|br)\b", q)
    if bed_match:
        intent["bedrooms"] = int(bed_match.group(1))

    # Bathrooms
    bath_match = re.search(r"(\d+)\s*(?:bath(?:room)?s?|ba)\b", q)
    if bath_match:
        intent["bathrooms"] = int(bath_match.group(1))

    # Price range  e.g. "500000 to 1000000" or "between 500k and 1m"
    price_range = re.search(
        r"(?:between\s+)?(\d[\d,\.]*[km]?)\s+(?:to|and|-)\s+(\d[\d,\.]*[km]?)",
        q,
    )
    if price_range:
        intent["min_price"] = _parse_price(price_range.group(1))
        intent["max_price"] = _parse_price(price_range.group(2))

    under_match = re.search(r"(?:under|below|less than|max)\s+(\d[\d,\.]*[km]?)", q)
    if under_match:
        intent["max_price"] = _parse_price(under_match.group(1))

    over_match = re.search(r"(?:over|above|more than|min(?:imum)?)\s+(\d[\d,\.]*[km]?)", q)
    if over_match:
        intent["min_price"] = _parse_price(over_match.group(1))

    # Projects vs properties
    if any(w in q for w in ("project", "projects", "development", "developments", "darglobal project")):
        intent["want_projects"] = True
        intent["want_properties"] = "propert" in q or "villa" in q or "apartment" in q

    return intent


def _parse_price(raw: str) -> Optional[float]:
    """Convert '500k', '1.5m', '1,000,000' → float."""
    s = raw.replace(",", "").lower().strip()
    try:
        if s.endswith("m"):
            return float(s[:-1]) * 1_000_000
        if s.endswith("k"):
            return float(s[:-1]) * 1_000
        return float(s)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# SQL search helpers
# ---------------------------------------------------------------------------

def _sql_search_properties(
    db: Session,
    intent: Dict[str, Any],
    source_filter: str,
    top_k: int,
) -> List[Dict[str, Any]]:
    """Query the properties table using parsed intent."""
    q = db.query(Property)

    # Effective source (intent override)
    effective_source = _effective_source(source_filter, intent)
    if effective_source and effective_source.lower() not in ("all", "both", ""):
        q = q.filter(Property.source == effective_source)

    if intent["cities"]:
        city_filters = [Property.city.ilike(f"%{c}%") for c in intent["cities"]]
        city_filters += [Property.location.ilike(f"%{c}%") for c in intent["cities"]]
        q = q.filter(or_(*city_filters))

    if intent["property_types"]:
        type_filters = [Property.property_type.ilike(f"%{t}%") for t in intent["property_types"]]
        q = q.filter(or_(*type_filters))

    if intent["sale_or_rent"]:
        q = q.filter(Property.sale_or_rent.ilike(f"%{intent['sale_or_rent']}%"))

    if intent["bedrooms"] is not None:
        q = q.filter(Property.bedrooms == intent["bedrooms"])

    if intent["bathrooms"] is not None:
        q = q.filter(Property.bathrooms == intent["bathrooms"])

    if intent["min_price"] is not None:
        q = q.filter(Property.price >= intent["min_price"])

    if intent["max_price"] is not None:
        q = q.filter(Property.price <= intent["max_price"])

    rows = q.limit(top_k).all()
    results = []
    for p in rows:
        amenities_str = ""
        if p.amenities:
            if isinstance(p.amenities, list):
                amenities_str = ", ".join(str(a) for a in p.amenities[:6])
            else:
                amenities_str = str(p.amenities)

        text_body = (
            f"{p.title}. "
            f"Type: {p.property_type or 'N/A'}. "
            f"City: {p.city or p.location or 'N/A'}. "
            f"Sale/Rent: {p.sale_or_rent or 'N/A'}. "
            f"Price: {p.price or 'N/A'} {p.currency or ''}. "
            f"Bedrooms: {p.bedrooms or 'N/A'}, Bathrooms: {p.bathrooms or 'N/A'}, "
            f"Area: {p.area or 'N/A'} {p.area_unit or 'SQM'}. "
            + (f"Amenities: {amenities_str}. " if amenities_str else "")
            + (f"Description: {(p.description or '')[:300]}")
        )
        results.append({
            "chunk_id": f"prop-{p.id}",
            "document_id": f"prop-{p.id}",
            "title": p.title,
            "source": p.source,
            "url": p.source_url,
            "text": text_body,
            "relevance_score": 0.85,  # SQL match is authoritative
            "metadata": {
                "record_type": "property",
                "property_type": p.property_type,
                "city": p.city,
                "price": p.price,
                "currency": p.currency,
                "bedrooms": p.bedrooms,
                "sale_or_rent": p.sale_or_rent,
            },
        })
    return results


def _sql_search_projects(
    db: Session,
    intent: Dict[str, Any],
    source_filter: str,
    top_k: int,
) -> List[Dict[str, Any]]:
    """Query the projects table using parsed intent."""
    q = db.query(Project)

    effective_source = _effective_source(source_filter, intent)
    if effective_source and effective_source.lower() not in ("all", "both", ""):
        q = q.filter(Project.source == effective_source)

    if intent["cities"]:
        city_filters = [Project.city.ilike(f"%{c}%") for c in intent["cities"]]
        city_filters += [Project.location.ilike(f"%{c}%") for c in intent["cities"]]
        city_filters += [Project.country.ilike(f"%{c}%") for c in intent["cities"]]
        q = q.filter(or_(*city_filters))

    rows = q.limit(top_k).all()
    results = []
    for p in rows:
        amenities_str = ""
        if p.amenities:
            if isinstance(p.amenities, list):
                amenities_str = ", ".join(str(a) for a in p.amenities[:6])
            else:
                amenities_str = str(p.amenities)

        text_body = (
            f"{p.name}. "
            f"Source: {p.source}. "
            f"City: {p.city or 'N/A'}, Country: {p.country or 'N/A'}. "
            f"Category: {p.property_category or 'N/A'}. "
            f"Type: {p.development_type or 'N/A'}. "
            f"Status: {p.status or 'N/A'}. "
            + (f"Luxury Brand: {p.luxury_brand}. " if p.luxury_brand else "")
            + (f"Starting Price: {p.starting_price} {p.currency or ''}. " if p.starting_price else "")
            + (f"Units: {p.total_units}. " if p.total_units else "")
            + (f"Amenities: {amenities_str}. " if amenities_str else "")
            + (f"Description: {(p.description or '')[:400]}")
        )
        results.append({
            "chunk_id": f"proj-{p.id}",
            "document_id": f"proj-{p.id}",
            "title": p.name,
            "source": p.source,
            "url": p.official_url,
            "text": text_body,
            "relevance_score": 0.85,
            "metadata": {
                "record_type": "project",
                "city": p.city,
                "country": p.country,
                "status": p.status,
                "luxury_brand": p.luxury_brand,
            },
        })
    return results


def _effective_source(source_filter: str, intent: Dict[str, Any]) -> str:
    """
    Merge UI source filter with query-detected source.
    If the query explicitly mentions both sources → use all.
    If the query mentions one source → prefer that one.
    """
    # Both sources mentioned in query intent → show all
    if intent.get("_mentions_both"):
        return "all"
    if intent.get("source"):
        return intent["source"]
    return source_filter or "all"


def _smart_source(source_filter: str, query: str) -> str:
    """Override source filter when the query explicitly names sources."""
    q = query.lower()
    has_dar = "darglobal" in q or "dar global" in q or " dar " in q
    has_wasalt = "wasalt" in q

    if has_dar and has_wasalt:
        return "all"
    if has_dar and source_filter and "wasalt" in source_filter.lower():
        return "all"
    if has_wasalt and source_filter and "dar" in source_filter.lower():
        return "all"
    return source_filter


# ---------------------------------------------------------------------------
# Full-text keyword fallback (for when SQL filters return nothing)
# ---------------------------------------------------------------------------

def _keyword_fallback(
    db: Session,
    query: str,
    source_filter: str,
    top_k: int,
) -> List[Dict[str, Any]]:
    """
    Scan document chunks for keyword matches when both SQL and vector retrieval
    return empty results.  This ensures some answer is always possible.
    """
    q_lower = query.lower()
    words = [w for w in re.split(r"\W+", q_lower) if len(w) >= 4]

    query_obj = db.query(DocumentChunk, Document).join(
        Document, DocumentChunk.document_id == Document.id
    )
    if source_filter and source_filter.lower() not in ("all", "both", ""):
        if "dar" in source_filter.lower():
            query_obj = query_obj.filter(Document.source_name == "DarGlobal")
        elif "wasalt" in source_filter.lower():
            query_obj = query_obj.filter(Document.source_name == "Wasalt")

    all_chunks = query_obj.limit(300).all()
    scored = []
    for chunk, doc in all_chunks:
        text_body = (chunk.chunk_text or "").lower()
        hits = sum(1 for w in words if w in text_body)
        if hits > 0:
            scored.append((hits, chunk, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for hits, chunk, doc in scored[:top_k]:
        results.append({
            "chunk_id": chunk.id,
            "document_id": doc.id,
            "title": doc.title,
            "source": doc.source_name,
            "url": doc.original_url,
            "text": chunk.chunk_text,
            "relevance_score": round(0.3 + min(hits * 0.05, 0.4), 3),
            "metadata": chunk.metadata_json,
        })
    return results


# ---------------------------------------------------------------------------
# Main RetrievalService
# ---------------------------------------------------------------------------

class RetrievalService:
    def __init__(self):
        self.embedding_service = embedding_service

    # ------------------------------------------------------------------
    # Document indexing (unchanged from original)
    # ------------------------------------------------------------------

    def index_pending_documents(self, db: Session) -> int:
        """Index all un-chunked documents using batch embedding."""
        docs = db.query(Document).all()
        docs_to_index = []
        for doc in docs:
            existing = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == doc.id
            ).first()
            if not existing:
                docs_to_index.append(doc)

        if not docs_to_index:
            return 0

        doc_preview_texts = [d.title + "\n" + d.text_content[:500] for d in docs_to_index]
        all_chunks_data = []
        for doc in docs_to_index:
            chunks = TextChunker.chunk_text(doc.text_content, chunk_size=300, chunk_overlap=40)
            if not chunks:
                chunks = [doc.text_content]
            for i, c_text in enumerate(chunks):
                all_chunks_data.append((doc, i, c_text))

        logger.info(f"Embedding {len(doc_preview_texts)} document summaries…")
        doc_embeddings = self.embedding_service.embed_batch(doc_preview_texts)
        for doc, emb in zip(docs_to_index, doc_embeddings):
            if emb is not None:
                doc.embedding = emb

        logger.info(f"Embedding {len(all_chunks_data)} document chunks in batch…")
        chunk_texts = [item[2] for item in all_chunks_data]
        chunk_embeddings = self.embedding_service.embed_batch(chunk_texts)

        for (doc, chunk_idx, chunk_text), emb in zip(all_chunks_data, chunk_embeddings):
            chunk_record = DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk_idx,
                chunk_text=chunk_text,
                embedding=emb,  # May be None — that's OK
                metadata_json={
                    "source": doc.source_name,
                    "title": doc.title,
                    "url": doc.original_url,
                    "doc_type": doc.doc_type,
                    **(doc.metadata_json or {}),
                },
            )
            db.add(chunk_record)

        db.commit()
        logger.info(
            f"RetrievalService: indexed {len(docs_to_index)} docs "
            f"({len(all_chunks_data)} chunks)."
        )
        return len(docs_to_index)

    # ------------------------------------------------------------------
    # Hybrid retrieval — PUBLIC entry point
    # ------------------------------------------------------------------

    def search_similar_chunks(
        self,
        db: Session,
        query: str,
        source_filter: str = "all",
        top_k: int = 6,
        similarity_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval pipeline:
        1. SQL structured search (always runs — no model dependency)
        2. Vector / cosine similarity search (skipped if model unavailable)
        3. Keyword fallback (runs only when 1 + 2 together return nothing)

        Returns up to top_k deduplicated result dicts.
        """
        threshold = (
            similarity_threshold
            if similarity_threshold is not None
            else settings.SIMILARITY_THRESHOLD
        )
        effective_filter = _smart_source(source_filter, query)
        intent = _parse_query_intent(query)

        # ----------------------------------------------------------------
        # Step 1 — SQL retrieval (structured database records)
        # ----------------------------------------------------------------
        sql_results: List[Dict[str, Any]] = []
        try:
            if intent["want_properties"] or not intent["want_projects"]:
                sql_results.extend(
                    _sql_search_properties(db, intent, effective_filter, top_k)
                )
            if intent["want_projects"]:
                sql_results.extend(
                    _sql_search_projects(db, intent, effective_filter, top_k)
                )

            # If intent wasn't specific, run a broader pass to get some data
            if not sql_results:
                sql_results.extend(
                    _sql_search_properties(db, {"cities": [], "property_types": [],
                                                "source": intent.get("source"),
                                                "min_price": None, "max_price": None,
                                                "bedrooms": None, "bathrooms": None,
                                                "sale_or_rent": None, "want_projects": False,
                                                "want_properties": True},
                                           effective_filter, top_k)
                )
                sql_results.extend(
                    _sql_search_projects(db, {"cities": [], "property_types": [],
                                              "source": intent.get("source"),
                                              "min_price": None, "max_price": None,
                                              "bedrooms": None, "bathrooms": None,
                                              "sale_or_rent": None, "want_projects": True,
                                              "want_properties": False},
                                           effective_filter, top_k)
                )
            logger.info(f"SQL retrieval returned {len(sql_results)} records.")
        except Exception as e:
            logger.error(f"SQL retrieval error: {e}", exc_info=True)

        # ----------------------------------------------------------------
        # Step 2 — Vector retrieval (optional, skipped if model unavailable)
        # ----------------------------------------------------------------
        vector_results: List[Dict[str, Any]] = []
        if self.embedding_service.is_available:
            try:
                vector_results = self._vector_search(
                    db, query, effective_filter, top_k, threshold
                )
                logger.info(f"Vector retrieval returned {len(vector_results)} records.")
            except Exception as e:
                logger.warning(f"Vector retrieval error (non-fatal): {e}")
        else:
            logger.info("Vector retrieval skipped — embedding model not available.")

        # ----------------------------------------------------------------
        # Step 3 — Merge, deduplicate, sort
        # ----------------------------------------------------------------
        combined = _merge_results(sql_results, vector_results, top_k)

        # ----------------------------------------------------------------
        # Step 4 — Keyword fallback when everything else returned nothing
        # ----------------------------------------------------------------
        if not combined:
            logger.info("Primary retrieval empty — running keyword fallback.")
            try:
                combined = _keyword_fallback(db, query, effective_filter, top_k)
                logger.info(f"Keyword fallback returned {len(combined)} records.")
            except Exception as e:
                logger.warning(f"Keyword fallback error (non-fatal): {e}")

        return combined[:top_k]

    # ------------------------------------------------------------------
    # Vector search (internal)
    # ------------------------------------------------------------------

    def _vector_search(
        self,
        db: Session,
        query: str,
        effective_source: str,
        top_k: int,
        threshold: float,
    ) -> List[Dict[str, Any]]:
        """Run cosine similarity search over document_chunks."""
        query_vector = self.embedding_service.embed_text(query)
        if query_vector is None:
            return []

        q_norm = np.array(query_vector, dtype=np.float32)
        norm_val = np.linalg.norm(q_norm)
        if norm_val > 0:
            q_norm = q_norm / norm_val

        # Try PostgreSQL pgvector first
        try:
            is_postgres = db.bind.dialect.name == "postgresql"
        except Exception:
            is_postgres = False

        if is_postgres:
            try:
                return self._pgvector_search(db, query_vector, effective_source, top_k, threshold)
            except Exception as e:
                logger.warning(f"pgvector query failed: {e} — falling back to Python cosine.")

        # Python cosine similarity (SQLite / no pgvector)
        return self._python_cosine_search(db, q_norm, norm_val, effective_source, top_k, threshold, query)

    def _pgvector_search(
        self,
        db: Session,
        query_vector: List[float],
        effective_source: str,
        top_k: int,
        threshold: float,
    ) -> List[Dict[str, Any]]:
        source_condition = ""
        params = {"q_vec": str(query_vector), "limit": top_k * 2}
        if effective_source and effective_source.lower() not in ("all", "both", ""):
            if "dar" in effective_source.lower():
                source_condition = "AND d.source_name = 'DarGlobal'"
            elif "wasalt" in effective_source.lower():
                source_condition = "AND d.source_name = 'Wasalt'"

        sql = f"""
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
        rows = db.execute(text(sql), params).fetchall()
        results = []
        for row in rows:
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
                    "metadata": row.metadata_json,
                })
        return results

    def _python_cosine_search(
        self,
        db: Session,
        q_norm: np.ndarray,
        norm_val: float,
        effective_source: str,
        top_k: int,
        threshold: float,
        query: str,
    ) -> List[Dict[str, Any]]:
        q_lower = query.lower()
        q_words = set(q_lower.split())

        query_obj = db.query(DocumentChunk, Document).join(
            Document, DocumentChunk.document_id == Document.id
        )
        if effective_source and effective_source.lower() not in ("all", "both", ""):
            if "dar" in effective_source.lower():
                query_obj = query_obj.filter(Document.source_name == "DarGlobal")
            elif "wasalt" in effective_source.lower():
                query_obj = query_obj.filter(Document.source_name == "Wasalt")

        all_chunks = query_obj.all()
        scored = []
        fallback = []

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
            emb_norm = np.linalg.norm(emb_arr)
            if emb_norm == 0 or norm_val == 0:
                continue
            cos_sim = float(np.dot(q_norm, emb_arr) / emb_norm)

            # Context boost for city / type matches
            effective_score = cos_sim
            doc_text_lower = (doc.title + " " + chunk.chunk_text).lower()
            for city in CITY_KEYWORDS:
                if city in q_words and city in doc_text_lower:
                    effective_score += 0.04
                    break
            if any(w in q_words for w in ("villa", "villas", "apartment", "apartments", "sale", "rent")):
                if doc.doc_type in ("property", "project"):
                    effective_score += 0.05

            cand = {
                "chunk_id": chunk.id,
                "document_id": doc.id,
                "title": doc.title,
                "source": doc.source_name,
                "url": doc.original_url,
                "text": chunk.chunk_text,
                "relevance_score": round(effective_score, 3),
                "metadata": chunk.metadata_json,
            }
            if cos_sim >= threshold:
                scored.append(cand)
            elif cos_sim >= 0.15:
                fallback.append(cand)

        if not scored and fallback:
            fallback.sort(key=lambda x: x["relevance_score"], reverse=True)
            return fallback[:top_k]

        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored[:top_k]


# ---------------------------------------------------------------------------
# Merge helper
# ---------------------------------------------------------------------------

def _merge_results(
    sql_results: List[Dict[str, Any]],
    vector_results: List[Dict[str, Any]],
    top_k: int,
) -> List[Dict[str, Any]]:
    """
    Combine SQL and vector results, deduplicate by URL/chunk_id,
    and sort by relevance score descending.
    SQL records get a slight boost to ensure they appear first
    (they come directly from the same DB as Data Explorer).
    """
    seen = set()
    merged = []

    for item in sql_results:
        key = item.get("url") or item.get("chunk_id")
        if key and key not in seen:
            seen.add(key)
            # Boost SQL records slightly above vector threshold
            item["relevance_score"] = max(item.get("relevance_score", 0.85), 0.80)
            merged.append(item)

    for item in vector_results:
        key = item.get("url") or item.get("chunk_id")
        if key and key not in seen:
            seen.add(key)
            merged.append(item)

    merged.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return merged[:top_k]


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

retrieval_service = RetrievalService()
