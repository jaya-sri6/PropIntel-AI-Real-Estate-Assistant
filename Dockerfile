# Multi-stage Dockerfile for PropIntel AI

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend & Runtime
FROM python:3.11-slim
WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose FastAPI port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start production server with dynamic port support (Render, Railway, Cloud Run, Local)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
