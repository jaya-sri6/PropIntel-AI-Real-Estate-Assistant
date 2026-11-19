# Production Dockerfile for PropIntel AI (Optimised for Render Free Tier)
# ---------------------------------------------------------
# Key optimisations:
#  - CPU-only PyTorch (saves ~1.3 GB vs CUDA build)
#  - SentenceTransformer model baked into image at build time
#    so Render workers start instantly without HuggingFace network calls
#  - Pre-built frontend/dist committed to repo — no Node build needed
# ---------------------------------------------------------

FROM python:3.11-slim

WORKDIR /app

# ---------------------------------------------------------------------------
# System packages — curl is needed for the health-check only
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Python dependencies
# ---------------------------------------------------------------------------
# 1. Lightweight CPU-only PyTorch (~250 MB instead of 2+ GB CUDA build)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Application requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# ---------------------------------------------------------------------------
# Pre-bake SentenceTransformer model into the image cache
# This runs at BUILD time — the model is downloaded once into the image,
# so Render containers start offline without needing HuggingFace network.
# ---------------------------------------------------------------------------
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV HF_HUB_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers

# Allow network during build so the model can be downloaded
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
model = SentenceTransformer('all-MiniLM-L6-v2'); \
print('Model baked successfully:', model); \
"

# ---------------------------------------------------------------------------
# Application code
# ---------------------------------------------------------------------------
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

# Persistent storage directories
RUN mkdir -p /app/uploads /app/.cache/huggingface /app/.cache/sentence_transformers

EXPOSE 8000

# ---------------------------------------------------------------------------
# Runtime environment
# ---------------------------------------------------------------------------
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV EMBEDDING_DEVICE=cpu
# Keep offline mode at runtime — model is in the image cache
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# ---------------------------------------------------------------------------
# Start server
# ---------------------------------------------------------------------------
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
