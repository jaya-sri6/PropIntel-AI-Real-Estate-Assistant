import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.api import health, chat, properties, projects, sources, admin
from backend.app.scrapers.scraper_manager import ScraperManager
from backend.app.services.retrieval_service import retrieval_service
from backend.app.models import Property, Project

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("propintel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and vector tables...")
    init_db()
    
    is_testing = os.getenv("TESTING", "0").lower() in ("1", "true", "yes") or settings.TESTING
    if not is_testing:
        db = SessionLocal()
        try:
            prop_count = db.query(Property).count()
            proj_count = db.query(Project).count()
            if prop_count == 0 and proj_count == 0:
                logger.info("Database is empty. Running initial verified data seeding & indexing...")
                manager = ScraperManager(db=db)
                manager.run_scraping(source_filter="all", index_service=retrieval_service, live=False)
                logger.info("Initial seeding & indexing completed.")
        except Exception as e:
            logger.error(f"Error during startup data initialization: {e}", exc_info=True)
        finally:
            db.close()
        
    yield
    logger.info("Shutting down PropIntel AI backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real Estate Intelligence Assistant for DarGlobal & Wasalt (RAG + OpenRouter LLM)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(properties.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(sources.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# Mount uploads directory for user attachments
uploads_dir = Path(__file__).parent.parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Mount frontend dist static assets if built
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    if (frontend_dist / "images").exists():
        app.mount("/images", StaticFiles(directory=str(frontend_dist / "images")), name="images")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to PropIntel AI API",
            "health": "/health",
            "docs": "/docs",
            "version": settings.VERSION
        }
