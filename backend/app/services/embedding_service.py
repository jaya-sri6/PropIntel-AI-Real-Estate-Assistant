import os
# Force offline mode for HuggingFace and Transformers to prevent network polling
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import logging
from typing import List, Union
import numpy as np
from backend.app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
        try:
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            logger.info("Successfully loaded SentenceTransformer.")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")
            self._model = None

    @property
    def model(self):
        if self._model is None:
            self._init_model()
        return self._model

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * 384
        try:
            embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error embedding text: {e}")
            return [0.0] * 384

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True, batch_size=32)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Error embedding batch: {e}")
            return [[0.0] * 384 for _ in texts]

embedding_service = EmbeddingService()
