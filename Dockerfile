# Production Dockerfile for PropIntel AI (Optimized for Render Free Tier)
FROM python:3.11-slim

WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight CPU-only PyTorch first (prevents downloading 1.5GB CUDA packages)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy pre-compiled frontend distribution
COPY frontend/dist/ ./frontend/dist/

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV EMBEDDING_DEVICE=cpu

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start production server with dynamic port binding
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
