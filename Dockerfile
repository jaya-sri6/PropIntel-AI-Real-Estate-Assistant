# Production Dockerfile for PropIntel AI (Optimised for Render Free Tier <= 512MB RAM)
# ---------------------------------------------------------
# Key optimisations:
#  - Ultra-lightweight build (no heavy PyTorch/CUDA wheels)
#  - Resilient SQL Hybrid Retrieval (instant database search)
#  - Pre-built frontend/dist included in image
#  - Pre-seeded SQLite database ready from start
# ---------------------------------------------------------

FROM python:3.11-slim

WORKDIR /app

# System packages — curl for container health-check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy application backend & pre-compiled frontend distribution
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

# Copy pre-seeded production database
COPY propintel.db /app/propintel.db

# Persistent storage directories
RUN mkdir -p /app/uploads

EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start server
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
