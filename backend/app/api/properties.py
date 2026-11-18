from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import Property
from backend.app.schemas.property import PropertyListResponse, PropertyResponse

router = APIRouter()

@router.get("/properties", response_model=PropertyListResponse, tags=["Properties"])
def list_properties(
    source: Optional[str] = Query(None, description="Filter by source: DarGlobal or Wasalt"),
    city: Optional[str] = Query(None, description="Filter by city"),
    property_type: Optional[str] = Query(None, description="Filter by property type (Villa, Apartment)"),
    sale_or_rent: Optional[str] = Query(None, description="sale or rent"),
    search: Optional[str] = Query(None, description="Search keyword in title, location, description"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Property)

    if source and source.lower() not in ("all", "both"):
        query = query.filter(Property.source.ilike(f"%{source}%"))
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if property_type:
        query = query.filter(Property.property_type.ilike(f"%{property_type}%"))
    if sale_or_rent:
        query = query.filter(Property.sale_or_rent == sale_or_rent.lower())
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Property.title.ilike(term),
                Property.location.ilike(term),
                Property.description.ilike(term),
                Property.district.ilike(term)
            )
        )

    total = query.count()
    items = query.order_by(Property.id.desc()).offset(offset).limit(limit).all()

    return PropertyListResponse(
        total=total,
        items=[PropertyResponse.model_validate(p) for p in items]
    )
