import logging
import os
import shutil
import time
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.rag_service import rag_service
from backend.app.models import Conversation

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", tags=["Chat"])
async def upload_attachment(file: UploadFile = File(...)):
    try:
        # Sanitize filename
        clean_name = os.path.basename(file.filename or "attachment")
        timestamp = int(time.time() * 1000)
        filename = f"{timestamp}_{clean_name}"
        dest_path = os.path.join(UPLOAD_DIR, filename)

        # Write file content
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(dest_path)
        content_type = file.content_type or "application/octet-stream"

        # Also copy to frontend dist uploads if it exists
        dist_uploads = os.path.join(os.getcwd(), "frontend", "dist", "uploads")
        os.makedirs(dist_uploads, exist_ok=True)
        shutil.copy2(dest_path, os.path.join(dist_uploads, filename))

        return {
            "name": clean_name,
            "url": f"/uploads/{filename}",
            "size": file_size,
            "content_type": content_type
        }
    except Exception as e:
        logger.error(f"Failed to process file upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File upload error: {str(e)}")

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        response = await rag_service.answer_query(
            db=db,
            message=request.message,
            conversation_id=request.conversation_id,
            source_filter=request.source_filter or "all",
            attachment_name=request.attachment_name,
            attachment_url=request.attachment_url
        )
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal chat error: {str(e)}")

@router.get("/conversations", tags=["Chat"])
def list_conversations(db: Session = Depends(get_db)):
    subq = (
        db.query(
            Conversation.conversation_id,
            func.max(Conversation.created_at).label("last_active")
        )
        .group_by(Conversation.conversation_id)
        .order_by(func.max(Conversation.created_at).desc())
        .limit(50)
        .all()
    )

    result = []
    for conv_id, last_active in subq:
        msgs = (
            db.query(Conversation)
            .filter(Conversation.conversation_id == conv_id)
            .order_by(Conversation.created_at.asc())
            .all()
        )
        if not msgs:
            continue
        first_user = next((m.message for m in msgs if m.role == "user"), "Conversation")
        result.append({
            "id": conv_id,
            "title": first_user[:60] + ("..." if len(first_user) > 60 else ""),
            "created_at": last_active.isoformat() if last_active else None,
            "formatted_date": last_active.strftime("%b %d, %H:%M") if last_active else "Recent",
            "message_count": len(msgs),
            "messages": [
                {
                    "id": f"msg-{m.id}",
                    "role": m.role,
                    "content": m.message,
                    "sources": m.sources_json or [],
                    "timestamp": m.created_at.strftime("%b %d, %Y • %H:%M") if m.created_at else ""
                }
                for m in msgs
            ]
        })
    return result

@router.delete("/conversations/{conversation_id}", tags=["Chat"])
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    db.query(Conversation).filter(Conversation.conversation_id == conversation_id).delete()
    db.commit()
    return {"status": "deleted", "conversation_id": conversation_id}
