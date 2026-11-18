from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from backend.app.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)  # DarGlobal or Wasalt
    title = Column(String(255), nullable=False, index=True)
    property_type = Column(String(100), nullable=True, index=True)  # Villa, Apartment, Penthouse, etc.
    sale_or_rent = Column(String(50), default="sale", index=True)  # sale or rent
    location = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    price = Column(Float, nullable=True, index=True)
    currency = Column(String(20), nullable=True)  # SAR, AED, GBP, USD, etc.
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area = Column(Float, nullable=True)
    area_unit = Column(String(20), default="SQM")
    description = Column(Text, nullable=True)
    amenities = Column(JSON, default=list)  # list of strings
    source_url = Column(String(500), unique=True, nullable=False, index=True)
    raw_data = Column(JSON, nullable=True)
    scraped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
