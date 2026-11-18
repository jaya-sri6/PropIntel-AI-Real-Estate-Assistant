import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models import Source, Property, Project, Document, ScrapeJob
from backend.app.scrapers.darglobal_scraper import DarGlobalScraper
from backend.app.scrapers.wasalt_scraper import WasaltScraper
from backend.app.scrapers.data_cleaner import DataCleaner

logger = logging.getLogger(__name__)

class ScraperManager:
    def __init__(self, db: Session):
        self.db = db
        self.scrapers = {
            "DarGlobal": DarGlobalScraper(),
            "Wasalt": WasaltScraper()
        }

    def ensure_sources(self):
        source_configs = [
            {
                "name": "DarGlobal",
                "base_url": "https://darglobal.co.uk",
                "description": "International luxury real estate developer listed on the London Stock Exchange, developing ultra-luxury branded residences across UAE, Saudi Arabia, Oman, UK, Spain, and Qatar."
            },
            {
                "name": "Wasalt",
                "base_url": "https://wasalt.sa/en",
                "description": "Leading Saudi Arabian real estate portal and digital marketplace offering verified sale and rental listings across Riyadh, Jeddah, Makkah, and other Saudi cities."
            }
        ]
        for cfg in source_configs:
            src = self.db.query(Source).filter(Source.name == cfg["name"]).first()
            if not src:
                src = Source(**cfg)
                self.db.add(src)
        self.db.commit()

    def run_scraping(self, source_filter: str = "all", index_service = None, live: bool = False) -> ScrapeJob:
        self.ensure_sources()

        job = ScrapeJob(
            source_name=source_filter,
            status="running",
            records_scraped=0,
            started_at=datetime.now(timezone.utc),
            details={}
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        total_records = 0
        details = {}
        errors = []

        active_scrapers = {}
        if source_filter.lower() in ("all", "both"):
            active_scrapers = self.scrapers
        elif "dar" in source_filter.lower():
            active_scrapers = {"DarGlobal": self.scrapers["DarGlobal"]}
        elif "wasalt" in source_filter.lower():
            active_scrapers = {"Wasalt": self.scrapers["Wasalt"]}
        else:
            active_scrapers = self.scrapers

        for name, scraper in active_scrapers.items():
            try:
                logger.info(f"ScraperManager: Running scraper for {name} (live={live})")
                data = scraper.scrape(live=live)
                
                proj_count = 0
                prop_count = 0
                doc_count = 0

                # Upsert Projects
                for proj_dict in data.get("projects", []):
                    url = proj_dict["source_url"]
                    existing = self.db.query(Project).filter(Project.official_url == url).first()
                    if not existing:
                        p = Project(
                            source=proj_dict["source"],
                            name=proj_dict["title"],
                            description=proj_dict.get("description"),
                            country=proj_dict.get("country"),
                            city=proj_dict.get("city"),
                            location=proj_dict.get("location"),
                            property_category=proj_dict.get("property_type"),
                            development_type=proj_dict.get("development_type"),
                            luxury_brand=proj_dict.get("luxury_brand"),
                            status=proj_dict.get("status"),
                            completion_date=proj_dict.get("completion_date"),
                            total_units=proj_dict.get("total_units"),
                            starting_price=proj_dict.get("price"),
                            currency=proj_dict.get("currency"),
                            amenities=proj_dict.get("amenities", []),
                            official_url=url,
                            scraped_at=datetime.now(timezone.utc)
                        )
                        self.db.add(p)
                        proj_count += 1
                    else:
                        existing.description = proj_dict.get("description")
                        existing.amenities = proj_dict.get("amenities", [])
                        existing.scraped_at = datetime.now(timezone.utc)

                # Upsert Properties
                for prop_dict in data.get("properties", []):
                    url = prop_dict["source_url"]
                    existing = self.db.query(Property).filter(Property.source_url == url).first()
                    if not existing:
                        p = Property(
                            source=prop_dict["source"],
                            title=prop_dict["title"],
                            property_type=prop_dict.get("property_type"),
                            sale_or_rent=prop_dict.get("sale_or_rent", "sale"),
                            location=prop_dict.get("location"),
                            city=prop_dict.get("city"),
                            district=prop_dict.get("district"),
                            price=prop_dict.get("price"),
                            currency=prop_dict.get("currency"),
                            bedrooms=prop_dict.get("bedrooms"),
                            bathrooms=prop_dict.get("bathrooms"),
                            area=prop_dict.get("area"),
                            area_unit=prop_dict.get("area_unit", "SQM"),
                            description=prop_dict.get("description"),
                            amenities=prop_dict.get("amenities", []),
                            source_url=url,
                            scraped_at=datetime.now(timezone.utc)
                        )
                        self.db.add(p)
                        prop_count += 1
                    else:
                        existing.price = prop_dict.get("price")
                        existing.description = prop_dict.get("description")
                        existing.scraped_at = datetime.now(timezone.utc)

                # Upsert Documents
                for doc_dict in data.get("documents", []):
                    url = doc_dict["original_url"]
                    doc_title = doc_dict["title"]
                    existing = self.db.query(Document).filter(
                        Document.original_url == url,
                        Document.title == doc_title
                    ).first()
                    if not existing:
                        d = Document(
                            source_name=doc_dict["source_name"],
                            original_url=url,
                            title=doc_title,
                            text_content=doc_dict["text_content"],
                            doc_type=doc_dict.get("doc_type", "property"),
                            metadata_json=doc_dict.get("metadata_json", {})
                        )
                        self.db.add(d)
                        doc_count += 1
                    else:
                        existing.text_content = doc_dict["text_content"]
                        existing.metadata_json = doc_dict.get("metadata_json", {})

                self.db.commit()

                details[name] = {
                    "projects": proj_count,
                    "properties": prop_count,
                    "documents": doc_count
                }
                total_records += (proj_count + prop_count)

            except Exception as e:
                self.db.rollback()
                logger.error(f"Error executing scraper {name}: {e}", exc_info=True)
                errors.append(f"{name}: {str(e)}")
                details[name] = {"error": str(e)}

        # Trigger indexing if index service provided
        if index_service:
            try:
                indexed_count = index_service.index_pending_documents(self.db)
                details["indexed_documents"] = indexed_count
            except Exception as e:
                self.db.rollback()
                logger.error(f"Error during document indexing: {e}")
                errors.append(f"Indexing: {str(e)}")

        job.status = "completed" if not errors else ("completed_with_errors" if total_records > 0 else "failed")
        job.records_scraped = total_records
        job.error_message = "; ".join(errors) if errors else None
        job.details = details
        job.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(job)

        return job
