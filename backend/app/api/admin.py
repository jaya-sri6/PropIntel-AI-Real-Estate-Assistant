import logging
import inspect
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models import Property, Project, Document, DocumentChunk, ScrapeJob
from backend.app.schemas.admin import AdminStatsResponse, ScrapeJobResponse, ScrapeTriggerRequest
from backend.app.scrapers.scraper_manager import ScraperManager
from backend.app.services.retrieval_service import retrieval_service

logger = logging.getLogger(__name__)
router = APIRouter()

def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    if not x_admin_key or x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing X-Admin-Key header"
        )
    return True

@router.get("/admin/stats", response_model=AdminStatsResponse, tags=["Admin"])
def get_admin_stats(db: Session = Depends(get_db)):
    prop_count = db.query(Property).count()
    proj_count = db.query(Project).count()
    darglobal_count = db.query(Project).filter(Project.source == "DarGlobal").count() + db.query(Property).filter(Property.source == "DarGlobal").count()
    wasalt_count = db.query(Property).filter(Property.source == "Wasalt").count() + db.query(Project).filter(Project.source == "Wasalt").count()
    doc_count = db.query(Document).count()
    chunk_count = db.query(DocumentChunk).count()

    latest_job = db.query(ScrapeJob).order_by(desc(ScrapeJob.started_at)).first()
    
    recent_errors = []
    if latest_job and latest_job.error_message:
        recent_errors.append(latest_job.error_message)

    return AdminStatsResponse(
        total_records=prop_count + proj_count,
        darglobal_record_count=darglobal_count,
        wasalt_record_count=wasalt_count,
        properties_count=prop_count,
        projects_count=proj_count,
        indexed_document_count=doc_count,
        indexed_chunks_count=chunk_count,
        last_scraping_timestamp=latest_job.started_at if latest_job else None,
        scraping_status=latest_job.status if latest_job else "idle",
        recent_errors=recent_errors
    )

@router.post("/admin/scrape", response_model=ScrapeJobResponse, tags=["Admin"])
async def trigger_scrape(
    request: ScrapeTriggerRequest = ScrapeTriggerRequest(),
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_admin_key)
):
    try:
        manager = ScraperManager(db=db)
        job = manager.run_scraping(
            source_filter=request.source or "all",
            index_service=retrieval_service,
            live=True
        )
        if inspect.iscoroutine(job):
            job = await job
        return ScrapeJobResponse.model_validate(job)
    except Exception as e:
        logger.error(f"Error triggering scrape: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@router.get("/admin/scrape/status", response_model=Optional[ScrapeJobResponse], tags=["Admin"])
def get_scrape_status(db: Session = Depends(get_db)):
    latest_job = db.query(ScrapeJob).order_by(desc(ScrapeJob.started_at)).first()
    if not latest_job:
        return None
    return ScrapeJobResponse.model_validate(latest_job)
