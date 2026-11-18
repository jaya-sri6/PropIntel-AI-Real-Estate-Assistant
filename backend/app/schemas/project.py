from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ProjectBase(BaseModel):
    source: str
    name: str
    description: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    property_category: Optional[str] = None
    development_type: Optional[str] = None
    luxury_brand: Optional[str] = None
    status: Optional[str] = None
    completion_date: Optional[str] = None
    total_units: Optional[int] = None
    starting_price: Optional[float] = None
    currency: Optional[str] = None
    amenities: List[str] = []
    official_url: str
    scraped_at: Optional[datetime] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    total: int
    items: List[ProjectResponse]
