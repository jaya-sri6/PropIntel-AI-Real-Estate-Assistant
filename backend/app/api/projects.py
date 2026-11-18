from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import Project
from backend.app.schemas.project import ProjectListResponse, ProjectResponse

router = APIRouter()

@router.get("/projects", response_model=ProjectListResponse, tags=["Projects"])
def list_projects(
    source: Optional[str] = Query(None, description="Filter by source: DarGlobal or Wasalt"),
    country: Optional[str] = Query(None, description="Filter by country (UAE, Saudi Arabia, Oman, UK, Spain)"),
    luxury_brand: Optional[str] = Query(None, description="Filter by luxury brand (Pagani, Aston Martin, Fendi Casa, Trump)"),
    search: Optional[str] = Query(None, description="Search keyword in name, location, description"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if source and source.lower() not in ("all", "both"):
        query = query.filter(Project.source.ilike(f"%{source}%"))
    if country:
        query = query.filter(Project.country.ilike(f"%{country}%"))
    if luxury_brand:
        query = query.filter(Project.luxury_brand.ilike(f"%{luxury_brand}%"))
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Project.name.ilike(term),
                Project.location.ilike(term),
                Project.description.ilike(term),
                Project.city.ilike(term),
                Project.luxury_brand.ilike(term)
            )
        )

    total = query.count()
    items = query.order_by(Project.id.desc()).offset(offset).limit(limit).all()

    return ProjectListResponse(
        total=total,
        items=[ProjectResponse.model_validate(p) for p in items]
    )
