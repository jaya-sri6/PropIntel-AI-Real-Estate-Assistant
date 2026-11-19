import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# HuggingFace / SentenceTransformers cache configuration
# These must be set BEFORE importing sentence_transformers so the library
# reads the correct cache directory both during the Docker build (pre-bake)
# and at runtime on Render.
# ---------------------------------------------------------------------------
_HF_CACHE = os.environ.get("HF_HOME", "/app/.cache/huggingface")
_ST_CACHE = os.environ.get("SENTENCE_TRANSFORMERS_HOME", "/app/.cache/sentence_transformers")

os.environ.setdefault("HF_HOME", _HF_CACHE)
os.environ.setdefault("TRANSFORMERS_CACHE", _HF_CACHE)
os.environ.setdefault("HF_HUB_CACHE", _HF_CACHE)
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", _ST_CACHE)
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

# Disable network access — only load from local cache.
# If the model was baked into the Docker image this is safe.
# If the cache is cold (local dev without baking) we fall back gracefully.
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from backend.app.config import settings


class EmbeddingService:
    """
    Singleton wrapper around SentenceTransformer.

    Design goals
    ============
    1. Never crash the application if the model cannot be loaded.
    2. Return a sentinel value (None / zero-vector) so callers can decide
       whether to skip vector retrieval and fall back to SQL search.
    3. Work correctly when the model is pre-baked into the Docker image
       (offline mode) *and* when running locally with network access.
    """

    _instance: Optional["EmbeddingService"] = None
    _model = None  # SentenceTransformer instance or None

    def __new__(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_model()
        return cls._instance

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _init_model(self) -> None:
        model_name = settings.EMBEDDING_MODEL_NAME
        logger.info(f"EmbeddingService: attempting to load '{model_name}' …")

        # --- attempt 1: offline cache (fastest, works on Render after bake) ---
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(model_name)
            logger.info("EmbeddingService: model loaded successfully from cache.")
            return
        except (ImportError, ModuleNotFoundError) as e:
            logger.info(f"EmbeddingService: sentence-transformers not installed ({e}) — running in fast SQL hybrid mode.")
            self._model = None
            return
        except Exception as e:
            logger.warning(f"EmbeddingService: offline load failed ({e}). Retrying with network …")

        # --- attempt 2: allow network with short timeout (local dev without pre-bake) ---
        prev_hf = os.environ.pop("HF_HUB_OFFLINE", None)
        prev_tr = os.environ.pop("TRANSFORMERS_OFFLINE", None)
        # Set a short network timeout so the server doesn't hang for minutes
        os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "10"
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(model_name)
            logger.info("EmbeddingService: model loaded successfully via network.")
            return
        except Exception as e:
            logger.error(
                f"EmbeddingService: could not load '{model_name}' — "
                f"vector retrieval disabled, SQL fallback will be used. Error: {e}"
            )
            self._model = None
        finally:
            # Restore offline env vars
            if prev_hf is not None:
                os.environ["HF_HUB_OFFLINE"] = prev_hf
            if prev_tr is not None:
                os.environ["TRANSFORMERS_OFFLINE"] = prev_tr
            os.environ.pop("HF_HUB_DOWNLOAD_TIMEOUT", None)

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    @property
    def is_available(self) -> bool:
        """True when the model is loaded and ready to embed text."""
        return self._model is not None

    def embed_text(self, text: str) -> Optional[List[float]]:
        """
        Embed a single string.
        Returns a list of floats on success, or None when the model is unavailable.
        Callers must handle None (do not call .encode() on None).
        """
        if not text or self._model is None:
            return None
        try:
            embedding = self._model.encode(
                text, convert_to_numpy=True, normalize_embeddings=True
            )
            return embedding.tolist()
        except Exception as e:
            logger.error(f"EmbeddingService.embed_text error: {e}")
            return None

    def embed_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Embed a list of strings.
        Returns a list of float-lists (or None entries where embedding failed).
        """
        if not texts or self._model is None:
            return [None] * len(texts)
        try:
            embeddings = self._model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=32,
            )
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"EmbeddingService.embed_batch error: {e}")
            return [None] * len(texts)


# Module-level singleton — imported by retrieval_service and indexing tasks
embedding_service = EmbeddingService()
