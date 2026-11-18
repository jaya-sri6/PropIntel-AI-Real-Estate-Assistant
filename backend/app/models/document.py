from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base, VectorType

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), nullable=False, index=True)  # DarGlobal or Wasalt
    original_url = Column(String(500), nullable=False, index=True)  # Indexed, not unique to allow multiple sections/FAQs per page
    title = Column(String(255), nullable=False, index=True)
    text_content = Column(Text, nullable=False)
    doc_type = Column(String(50), default="property")  # property, project, article, faq, corporate
    metadata_json = Column(JSON, default=dict)
    embedding = Column(VectorType(dim=384), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
