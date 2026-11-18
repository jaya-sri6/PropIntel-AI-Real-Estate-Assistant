from pydantic import BaseModel, Field
from typing import List, Optional

class SourceCitation(BaseModel):
    title: str
    source: str
    url: str
    relevance_score: Optional[float] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query")
    conversation_id: Optional[str] = Field(None, description="Optional conversation session ID")
    source_filter: Optional[str] = Field("all", description="'all', 'DarGlobal', or 'Wasalt'")
    attachment_name: Optional[str] = Field(None, description="Name of attached file")
    attachment_url: Optional[str] = Field(None, description="URL of uploaded attachment")

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation] = []
    conversation_id: str
