from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Source
from backend.app.schemas.source import SourceResponse

router = APIRouter()

@router.get("/sources", response_model=List[SourceResponse], tags=["Sources"])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    return [SourceResponse.model_validate(s) for s in sources]
