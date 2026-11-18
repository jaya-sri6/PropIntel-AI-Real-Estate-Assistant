import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    def __init__(self, name: str, base_url: str):
        self.name = name
        self.base_url = base_url
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    @abstractmethod
    def scrape(self, live: bool = False) -> Dict[str, List[Dict[str, Any]]]:
        """
        Executes the scraping pipeline.
        Args:
            live: If True, attempts live HTTP/Playwright requests; if False, uses verified local scraped data.
        Returns:
            Dict with 'projects', 'properties', 'documents'
        """
        pass
