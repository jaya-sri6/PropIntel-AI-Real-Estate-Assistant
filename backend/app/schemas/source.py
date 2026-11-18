from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SourceResponse(BaseModel):
    id: int
    name: str
    base_url: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
