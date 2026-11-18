import os
os.environ["TESTING"] = "1"
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from backend.app.database import init_db
from backend.app.main import app
from backend.app.config import settings
from backend.app.schemas.chat import ChatResponse, SourceCitation

# Ensure tables are created
init_db()

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert data["app_name"] == "PropIntel AI"

def test_get_sources():
    resp = client.get("/api/sources")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_get_properties():
    resp = client.get("/api/properties?limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data

def test_get_projects():
    resp = client.get("/api/projects?limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data

def test_get_admin_stats():
    resp = client.get("/api/admin/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_records" in data
    assert "darglobal_record_count" in data
    assert "wasalt_record_count" in data

def test_admin_scrape_unauthorized():
    resp = client.post("/api/admin/scrape", json={"source": "all"})
    # Should reject without valid X-Admin-Key
    assert resp.status_code == 401

def test_admin_scrape_authorized():
    with patch("backend.app.api.admin.ScraperManager") as MockManager:
        mock_instance = MockManager.return_value
        from backend.app.models import ScrapeJob
        from datetime import datetime, timezone
        mock_job = ScrapeJob(
            id=1,
            source_name="all",
            status="completed",
            records_scraped=10,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )
        mock_instance.run_scraping = AsyncMock(return_value=mock_job)

        resp = client.post(
            "/api/admin/scrape",
            json={"source": "all"},
            headers={"X-Admin-Key": settings.ADMIN_API_KEY}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"

def test_chat_endpoint_valid():
    with patch("backend.app.services.rag_service.rag_service.answer_query", new_callable=AsyncMock) as mock_answer:
        mock_answer.return_value = ChatResponse(
            answer="DarGlobal has The Pagani Penthouse in Dubai.",
            sources=[
                SourceCitation(
                    title="The Pagani Penthouse",
                    source="DarGlobal",
                    url="https://darglobal.co.uk/one-of-one/project-pagani",
                    relevance_score=0.92
                )
            ],
            conversation_id="test-conv-123"
        )
        resp = client.post(
            "/api/chat",
            json={
                "message": "What projects does DarGlobal have in Dubai?",
                "source_filter": "DarGlobal"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "Pagani" in data["answer"]
        assert len(data["sources"]) == 1
        assert data["sources"][0]["source"] == "DarGlobal"

def test_chat_endpoint_empty_message_validation():
    # Pydantic validation: message cannot be empty string
    resp = client.post(
        "/api/chat",
        json={"message": ""}
    )
    assert resp.status_code == 422
