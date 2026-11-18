import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Document, DocumentChunk
from backend.app.services.embedding_service import embedding_service
from backend.app.services.retrieval_service import retrieval_service
from backend.app.utils.chunking import TextChunker

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()

def test_embedding_generation():
    text = "DarGlobal luxury villa in Dubai with Pagani interiors"
    emb = embedding_service.embed_text(text)
    assert len(emb) == 384
    assert isinstance(emb[0], float)

def test_text_chunking():
    long_text = "word " * 600
    chunks = TextChunker.chunk_text(long_text, chunk_size=300, chunk_overlap=50)
    assert len(chunks) >= 2
    assert len(chunks[0].split()) <= 300

@pytest.mark.asyncio
async def test_indexing_and_vector_retrieval(test_db):
    doc1 = Document(
        source_name="DarGlobal",
        original_url="https://darglobal.co.uk/one-of-one/project-pagani",
        title="The Pagani Penthouse Dubai",
        doc_type="project",
        text_content="The Pagani Penthouse is an ultra-luxury residential tower overlooking Dubai Canal in Dubai, UAE with Pagani interiors.",
        metadata_json={"source": "DarGlobal", "city": "Dubai"}
    )
    doc2 = Document(
        source_name="Wasalt",
        original_url="https://wasalt.sa/en/property/villa-riyadh-101",
        title="Villa for Sale in Ar-Rimal Riyadh",
        doc_type="property",
        text_content="A standalone 4-bedroom villa for sale in Ar-Rimal district, Riyadh with price of SAR 2,150,000.",
        metadata_json={"source": "Wasalt", "city": "Riyadh"}
    )
    test_db.add_all([doc1, doc2])
    test_db.commit()

    indexed = await retrieval_service.index_pending_documents(test_db)
    assert indexed == 2

    # Query for Dubai projects
    results_dubai = retrieval_service.search_similar_chunks(test_db, "Pagani luxury penthouses in Dubai", top_k=2)
    assert len(results_dubai) > 0
    assert results_dubai[0]["source"] == "DarGlobal"
    assert "Pagani" in results_dubai[0]["title"]

    # Query with source filter Wasalt
    results_wasalt = retrieval_service.search_similar_chunks(
        test_db,
        "villas in Riyadh",
        source_filter="Wasalt",
        top_k=2
    )
    assert len(results_wasalt) > 0
    assert results_wasalt[0]["source"] == "Wasalt"
    assert "Riyadh" in results_wasalt[0]["title"]

    # DarGlobal filter should return nothing for Wasalt query
    results_dar_filtered = retrieval_service.search_similar_chunks(
        test_db,
        "villas in Riyadh Ar-Rimal",
        source_filter="DarGlobal",
        top_k=2,
        similarity_threshold=0.5
    )
    assert len(results_dar_filtered) == 0
