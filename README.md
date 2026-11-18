# PropIntel AI – DarGlobal & Wasalt Real Estate Intelligence Assistant

A production-grade, AI-powered real estate intelligence assistant that collects publicly available data from **DarGlobal** and **Wasalt**, indexes it with **SentenceTransformers** (`all-MiniLM-L6-v2`) and **PostgreSQL pgvector**, and answers real estate inquiries using **Retrieval-Augmented Generation (RAG)** powered by OpenRouter's free LLM.

---

## 🏛️ Architecture & System Pipeline

```mermaid
flowchart TD
    subgraph Data Extraction & Ingestion
        DG[DarGlobal Website & Projects] --> DGS[DarGlobal Scraper]
        WS[Wasalt Real Estate Listings] --> WSS[Wasalt Scraper]
        DGS --> DC[Data Cleaner & Normalizer]
        WSS --> DC
        DC --> DB[(PostgreSQL + pgvector / SQLite)]
    end

    subgraph Embedding & Indexing
        DB --> TC[Text Chunking Engine]
        TC --> EMB[SentenceTransformer all-MiniLM-L6-v2]
        EMB --> VEC[(Vector Index - 384d)]
    end

    subgraph User Interaction & File Uploads
        UI([Luxury UI Assistant]) --> Chat[Chat & Prompt Shortcuts]
        UI --> Upload[Paperclip File & Image Upload]
        Upload --> UpAPI[POST /api/upload]
        UpAPI --> Static[/uploads/ Storage & Preview]
    end

    subgraph RAG & Chat Pipeline
        Chat --> Pre[Query Preprocessing]
        Pre --> QEmb[Query Embedding]
        QEmb --> Ret[Vector Similarity Search Top-K]
        VEC -.-> Ret
        Ret --> Filter[Source & Metadata Filter]
        Filter --> Ctx[Grounded Context Construction]
        Static -.-> Ctx
        Ctx --> LLM[OpenRouter Free LLM API]
        LLM --> Clean[Asterisk & Formatting Sanitizer]
        Clean --> UI
    end
```

---

## ✨ Key Features & Capabilities

### 1. Grounded Real Estate RAG Assistant
- **Strict Factual Accuracy**: Generates clean, formatted answers grounded strictly in the 180+ indexed documents and project catalogs.
- **Zero Raw Formatting Noise**: Automatic sanitization eliminates raw markdown asterisks (`**`) and noisy header tokens (`#`) for clean typography.
- **Interactive Citations**: Clickable source cards displaying official DarGlobal and Wasalt URLs with relevance scores.

### 2. File & Document Uploads (`📎`)
- **Multi-Format Attachment**: Upload architectural photos, floor plans, PDF brochures, and listing documents (`.jpg`, `.png`, `.webp`, `.pdf`, `.doc`, `.docx`, `.txt`).
- **Interactive Preview Chip**: Real-time upload status with thumbnail preview, file name, file size, and one-click dismissal.
- **In-Chat Rendering**: User bubbles display expandable image previews and document cards, with metadata injected into the AI context.

### 3. Purpose-Built Explorers
- **Project Explorer (Master Development Showcase)**:
  - Full-page cinematic showcase of 65 major developments (*The Opus* by Zaha Hadid, *The Pagani Penthouse*, *Da Vinci Tower*, *Shams Al Riyadh*, *Sedra*, etc.).
  - Multi-angle thumbnail galleries, developer pedigree badges, architectural highlights, and an interactive horizontal project catalog browser.
- **Data Explorer (Property Market Inventory)**:
  - Directory of 104+ verified real estate listings across Riyadh, Jeddah, Makkah, Khobar, and Dubai.
  - Granular filters by property type (Villas, Apartments, Floors, Townhouses), purpose (For Sale / Rent), price range, and bedrooms.

### 4. Enterprise Admin Dashboard
- **Live Health Monitoring**: Real-time stats (Total Records, DarGlobal, Wasalt, Indexed Docs).
- **Database Connection Pulse**: Animated ECG waveform reflecting live database status.
- **On-Demand Scraping**: Trigger full or single-source extraction pipelines directly from the UI with real-time log streaming.

### 5. Persistent Conversation History
- **Two-Column Session Browser**: View past chat sessions grouped by conversation ID with timestamps and message counts.
- **Session Management**: One-click "Continue Conversation →", transcript review, and session deletion.

### 6. Curated Media & Widescreen Views
- **Authentic Imagery**: High-resolution photography of luxury villas, branded residences, and panoramic skylines.
- **About Section**: Full-page overview with Downtown Dubai skyline panorama, technical specifications, and system architecture cards.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Vector Search** | PostgreSQL with `pgvector` (cosine distance) / SQLite hybrid fallback |
| **Embeddings** | `sentence-transformers` with `all-MiniLM-L6-v2` (384-dimensional dense vectors) |
| **Web Scraping** | Playwright (headless browser for JS portfolios), BeautifulSoup4, HTTPX |
| **LLM & Inference** | OpenRouter API (`openrouter/free` or configurable models) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Containerization** | Docker, Docker Compose (multi-stage build) |

---

## ⚡ Quick Start: Running the Application

### 1. Local Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd "PropIntel AI"

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start backend (FastAPI + RAG Engine)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 5. In a separate terminal, run frontend (Vite dev server)
cd frontend
npm install
npm run dev
```

Visit:
- **Web Application UI**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:8000](http://localhost:8000) when built)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Backend Test Suite Commands

Run the automated test suites using `pytest`:

### Run All Backend Tests
```bash
python -m pytest backend/tests/ -v
```

### Run Specific Test Modules

1. **Data Cleaning, Normalization & Deduplication**:
   ```bash
   python -m pytest backend/tests/test_cleaning.py -v
   ```

2. **Embeddings & Vector Retrieval**:
   ```bash
   python -m pytest backend/tests/test_embeddings_and_retrieval.py -v
   ```

3. **RAG Pipeline & Acceptance Scenarios**:
   ```bash
   python -m pytest backend/tests/test_rag.py -v
   ```

4. **FastAPI Endpoints, Validation & Admin Security**:
   ```bash
   python -m pytest backend/tests/test_api.py -v
   ```

---

## 🐳 Docker & Docker Compose Containerization

Run the full containerized stack (PostgreSQL with `pgvector` + FastAPI + Built React UI):

```bash
# Build and run with Docker Compose
docker compose up --build
```

The application will be accessible at `http://localhost:8000`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check & model status |
| `POST` | `/api/chat` | RAG Chatbot query endpoint with source filtering |
| `POST` | `/api/upload` | Upload images, brochures, and listing documents |
| `GET` | `/api/conversations` | Retrieve past chat sessions and messages |
| `DELETE`| `/api/conversations/{id}` | Delete a specific conversation session |
| `GET` | `/api/properties` | Filter and search Wasalt & DarGlobal properties |
| `GET` | `/api/projects` | Filter and search international luxury developments |
| `GET` | `/api/sources` | List active real estate sources |
| `GET` | `/api/admin/stats` | Pipeline records, index statistics & errors |
| `POST` | `/api/admin/scrape` | Trigger extraction pipeline (`X-Admin-Key` required) |
| `GET` | `/api/admin/scrape/status` | Status of the latest scraping job |

### Example Chat Request with Attachment:
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you analyze this floor plan and compare with Riyadh villas?",
    "source_filter": "all",
    "attachment_name": "floorplan.jpg",
    "attachment_url": "/uploads/1795037695_floorplan.jpg"
  }'
```

---

## 🌐 Production Deployment Guide

### Deploying to Render
1. Push repository to GitHub.
2. In the Render Dashboard, select **New > Web Service**.
3. Connect your repository and select the **Docker** runtime.
4. Set Environment Variables:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `DATABASE_URL`: Connection string to your PostgreSQL database (e.g. Neon or Render Postgres)
   - `ADMIN_API_KEY`: `propintel-admin-secret-2026`
5. Click **Create Web Service**.
