from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from backend.app.database import Base

class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), nullable=False)  # DarGlobal, Wasalt, or all
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    records_scraped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
