from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ScrapeTriggerRequest(BaseModel):
    source: Optional[str] = "all"  # DarGlobal, Wasalt, or all

class ScrapeJobResponse(BaseModel):
    id: int
    source_name: str
    status: str
    records_scraped: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_records: int
    darglobal_record_count: int
    wasalt_record_count: int
    properties_count: int
    projects_count: int
    indexed_document_count: int
    indexed_chunks_count: int
    last_scraping_timestamp: Optional[datetime] = None
    scraping_status: str
    recent_errors: List[str] = []
