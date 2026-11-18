import asyncio
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, init_db, SessionLocal
from backend.app.scrapers.scraper_manager import ScraperManager
from backend.app.services.retrieval_service import retrieval_service
from backend.app.models import Property, Project, Document, DocumentChunk, Source

def seed():
    print("Dropping existing tables to ensure clean schema...", flush=True)
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS document_chunks"))
        conn.execute(text("DROP TABLE IF EXISTS documents"))
        conn.execute(text("DROP TABLE IF EXISTS properties"))
        conn.execute(text("DROP TABLE IF EXISTS projects"))
        conn.execute(text("DROP TABLE IF EXISTS sources"))
        conn.commit()

    print("Re-initializing database tables...", flush=True)
    init_db()
    db = SessionLocal()
    try:
        print("Running ScraperManager to populate DarGlobal & Wasalt records...", flush=True)
        manager = ScraperManager(db=db)
        job = manager.run_scraping(source_filter="all", index_service=retrieval_service, live=False)
        print(f"Scrape Job finished with status: {job.status}", flush=True)
        print(f"Total records ingested: {job.records_scraped}", flush=True)
        
        proj_count = db.query(Project).count()
        prop_count = db.query(Property).count()
        doc_count = db.query(Document).count()
        chunk_count = db.query(DocumentChunk).count()
        
        print("\n" + "=" * 40, flush=True)
        print("         DATABASE SUMMARY", flush=True)
        print("=" * 40, flush=True)
        print(f"  • Projects in DB:   {proj_count}", flush=True)
        print(f"  • Properties in DB: {prop_count}", flush=True)
        print(f"  • Documents in DB:  {doc_count}", flush=True)
        print(f"  • Chunks Indexed:   {chunk_count}", flush=True)
        print("=" * 40, flush=True)
        assert proj_count > 0, "No projects inserted!"
        assert prop_count > 0, "No properties inserted!"
        assert chunk_count > 0, "No chunks indexed!"
        print("Database seeding & vector indexing completed successfully!", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
