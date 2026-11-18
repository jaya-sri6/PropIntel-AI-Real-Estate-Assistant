import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PropIntel AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    TESTING: bool = os.getenv("TESTING", "0").lower() in ("1", "true", "yes")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./propintel.db")
    
    # OpenRouter LLM
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    
    # Embeddings & Vector Search
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.25"))
    TOP_K_CHUNKS: int = int(os.getenv("TOP_K_CHUNKS", "6"))
    
    # Admin Security
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "propintel-admin-secret-2026")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
