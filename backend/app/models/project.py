from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from backend.app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)  # DarGlobal or Wasalt
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    country = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    location = Column(String(255), nullable=True)
    property_category = Column(String(100), nullable=True)  # Residential, Hospitality, Mixed-Use
    development_type = Column(String(100), nullable=True)  # Master Community, Tower, Villas, etc.
    luxury_brand = Column(String(100), nullable=True, index=True)  # Pagani, Aston Martin, Fendi Casa, Trump, etc.
    status = Column(String(100), nullable=True)  # In Progress, Completed, Announced, For Sale
    completion_date = Column(String(100), nullable=True)
    total_units = Column(Integer, nullable=True)
    starting_price = Column(Float, nullable=True)
    currency = Column(String(20), nullable=True)
    amenities = Column(JSON, default=list)  # list of strings
    official_url = Column(String(500), unique=True, nullable=False, index=True)
    raw_data = Column(JSON, nullable=True)
    scraped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
