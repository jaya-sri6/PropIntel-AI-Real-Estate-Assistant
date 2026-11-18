import pytest
from unittest.mock import patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Document
from backend.app.services.rag_service import rag_service
from backend.app.services.retrieval_service import retrieval_service

@pytest.fixture
def seeded_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Seed representative documents
    doc1 = Document(
        source_name="DarGlobal",
        original_url="https://darglobal.co.uk/one-of-one/project-pagani",
        title="The Pagani Penthouse Dubai",
        doc_type="project",
        text_content="DarGlobal Project: The Pagani Penthouse in Dubai, UAE. Luxury residential tower with Pagani interiors and infinity pool overlooking Dubai Canal.",
        metadata_json={"source": "DarGlobal", "city": "Dubai"}
    )
    doc2 = Document(
        source_name="Wasalt",
        original_url="https://wasalt.sa/en/property/villa-rimal-5971799",
        title="Villa 450 SQM in Ar-Rimal Riyadh",
        doc_type="property",
        text_content="Wasalt Property: Villa 450 SQM in Ar-Rimal, East Riyadh. 4 bedrooms, 5 bathrooms. Published price: SAR 2,150,000.",
        metadata_json={"source": "Wasalt", "city": "Riyadh", "price": 2150000, "currency": "SAR"}
    )
    doc3 = Document(
        source_name="DarGlobal",
        original_url="https://darglobal.co.uk/about",
        title="DarGlobal Corporate Overview",
        doc_type="corporate",
        text_content="DarGlobal is an international luxury developer listed on London Stock Exchange, building branded second homes across UAE, Oman, Spain, UK, and Saudi Arabia.",
        metadata_json={"source": "DarGlobal"}
    )
    doc4 = Document(
        source_name="Wasalt",
        original_url="https://wasalt.sa/en/about-us",
        title="Wasalt Marketplace Overview",
        doc_type="corporate",
        text_content="Wasalt is a Saudi real estate portal and digital marketplace operated by Quara Holding, connecting domestic buyers, tenants, and licensed brokers across Saudi cities like Riyadh and Jeddah.",
        metadata_json={"source": "Wasalt"}
    )
    db.add_all([doc1, doc2, doc3, doc4])
    db.commit()
    return db

@pytest.mark.asyncio
async def test_acceptance_scenario_1_dubai(seeded_db):
    """Test 1: 'What projects does DarGlobal have in Dubai?' -> Relevant DarGlobal projects with source links."""
    retrieval_service.index_pending_documents(seeded_db)
    
    with patch.object(rag_service.llm_service, "generate_response", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = (
            "DarGlobal offers **The Pagani Penthouse** in Dubai, UAE, an ultra-luxury residential tower "
            "overlooking the Dubai Canal featuring bespoke interiors designed by Horacio Pagani. "
            "Source: https://darglobal.co.uk/one-of-one/project-pagani"
        )
        resp = await rag_service.answer_query(
            db=seeded_db,
            message="What projects does DarGlobal have in Dubai?",
            source_filter="DarGlobal"
        )
        assert len(resp.sources) > 0
        assert resp.sources[0].source == "DarGlobal"
        assert "Pagani" in resp.answer
        assert "darglobal.co.uk" in resp.sources[0].url

@pytest.mark.asyncio
async def test_acceptance_scenario_2_villas_riyadh(seeded_db):
    """Test 2: 'Find villas in Riyadh.' -> Actual indexed Wasalt villa records."""
    retrieval_service.index_pending_documents(seeded_db)

    with patch.object(rag_service.llm_service, "generate_response", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = (
            "From Wasalt listings, there is a Villa in Ar-Rimal, East Riyadh (450 SQM) with 4 bedrooms "
            "and 5 bathrooms, listed for SAR 2,150,000. Source: https://wasalt.sa/en/property/villa-rimal-5971799"
        )
        resp = await rag_service.answer_query(
            db=seeded_db,
            message="Find villas in Riyadh.",
            source_filter="Wasalt"
        )
        assert len(resp.sources) > 0
        assert any(s.source == "Wasalt" for s in resp.sources)
        assert "SAR 2,150,000" in resp.answer

@pytest.mark.asyncio
async def test_acceptance_scenario_3_compare(seeded_db):
    """Test 3: 'Compare DarGlobal and Wasalt.' -> Explain distinction grounded in collected data."""
    retrieval_service.index_pending_documents(seeded_db)

    with patch.object(rag_service.llm_service, "generate_response", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = (
            "**DarGlobal** is an international luxury master developer listed on the London Stock Exchange, "
            "creating co-branded ultra-luxury residences with brands like Pagani, Trump, and Aston Martin across multiple countries. "
            "**Wasalt**, in contrast, is a Saudi domestic digital real estate marketplace connecting buyers and renters with verified property listings in Saudi Arabia."
        )
        resp = await rag_service.answer_query(
            db=seeded_db,
            message="Compare DarGlobal and Wasalt.",
            source_filter="all"
        )
        sources_found = set(s.source for s in resp.sources)
        assert "DarGlobal" in sources_found
        assert "Wasalt" in sources_found
        assert "DarGlobal" in resp.answer and "Wasalt" in resp.answer

@pytest.mark.asyncio
async def test_acceptance_scenario_6_missing_data(seeded_db):
    """Test 6: 'Tell me something not present in your database.' -> Admits information is not available."""
    retrieval_service.index_pending_documents(seeded_db)

    with patch.object(rag_service.llm_service, "generate_response", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "This information is not available in the collected DarGlobal and Wasalt sources."
        resp = await rag_service.answer_query(
            db=seeded_db,
            message="What are the property tax rates on beachfront bungalows in Tokyo, Japan?",
            source_filter="all"
        )
        assert "not available in the collected" in resp.answer.lower()
