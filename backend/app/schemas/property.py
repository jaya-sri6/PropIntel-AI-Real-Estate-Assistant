from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class PropertyBase(BaseModel):
    source: str
    title: str
    property_type: Optional[str] = None
    sale_or_rent: Optional[str] = "sale"
    location: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    area_unit: Optional[str] = "SQM"
    description: Optional[str] = None
    amenities: List[str] = []
    source_url: str
    scraped_at: Optional[datetime] = None

class PropertyResponse(PropertyBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PropertyListResponse(BaseModel):
    total: int
    items: List[PropertyResponse]
