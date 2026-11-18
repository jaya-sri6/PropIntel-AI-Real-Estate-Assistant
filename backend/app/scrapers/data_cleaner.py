import re
import hashlib
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from typing import Optional, Dict, Any, List
from bs4 import BeautifulSoup

class DataCleaner:
    @staticmethod
    def canonicalize_url(url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        url = url.strip()
        if url.startswith("//"):
            url = "https:" + url
        elif not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        try:
            parsed = urlparse(url)
            filtered_query = [
                (k, v) for k, v in parse_qsl(parsed.query)
                if not (k.startswith("utm_") or k in {"ref", "fbclid", "gclid", "source"})
            ]
            path = parsed.path.rstrip("/")
            if not path:
                path = "/"
            
            canonical = urlunparse((
                "https",
                parsed.netloc.lower(),
                path,
                "",
                urlencode(filtered_query),
                ""
            ))
            return canonical
        except Exception:
            return url.strip().rstrip("/")

    @staticmethod
    def clean_html(raw_html: Optional[str]) -> str:
        if not raw_html:
            return ""
        soup = BeautifulSoup(raw_html, "html.parser")
        for tag in soup(["script", "style", "noscript", "svg", "header", "footer"]):
            tag.decompose()
        text = soup.get_text(separator=" ")
        return DataCleaner.normalize_text(text)

    @staticmethod
    def normalize_text(text: Optional[str]) -> str:
        if not text:
            return ""
        text = re.sub(r'[\r\n\t]+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def parse_float(val: Any) -> Optional[float]:
        if val is None or val == "":
            return None
        if isinstance(val, (int, float)):
            return float(val)
        try:
            cleaned = re.sub(r'[^\d.]', '', str(val))
            if cleaned:
                return float(cleaned)
        except Exception:
            pass
        return None

    @staticmethod
    def parse_int(val: Any) -> Optional[int]:
        if val is None or val == "":
            return None
        if isinstance(val, int):
            return val
        try:
            cleaned = re.sub(r'[^\d]', '', str(val))
            if cleaned:
                return int(cleaned)
        except Exception:
            pass
        return None

    @staticmethod
    def generate_fingerprint(source: str, title: str, location: Optional[str], price: Optional[float] = None) -> str:
        raw = f"{source.strip().lower()}|{title.strip().lower()}|{(location or '').strip().lower()}|{price or ''}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @staticmethod
    def normalize_record(record: Dict[str, Any]) -> Dict[str, Any]:
        source = record.get("source", "").strip()
        title = DataCleaner.normalize_text(record.get("title", ""))
        location = DataCleaner.normalize_text(record.get("location")) or None
        city = DataCleaner.normalize_text(record.get("city")) or None
        district = DataCleaner.normalize_text(record.get("district")) or None
        description = DataCleaner.normalize_text(record.get("description")) or None
        source_url = DataCleaner.canonicalize_url(record.get("source_url") or record.get("official_url"))

        price = DataCleaner.parse_float(record.get("price") or record.get("starting_price"))
        currency = record.get("currency")
        if currency:
            currency = str(currency).strip().upper()
        else:
            currency = None

        bedrooms = DataCleaner.parse_int(record.get("bedrooms"))
        bathrooms = DataCleaner.parse_int(record.get("bathrooms"))
        area = DataCleaner.parse_float(record.get("area"))
        amenities = record.get("amenities") or []
        if isinstance(amenities, list):
            amenities = [DataCleaner.normalize_text(a) for a in amenities if a and DataCleaner.normalize_text(a)]
        else:
            amenities = []

        scraped_at = record.get("scraped_at")
        if isinstance(scraped_at, datetime):
            scraped_at = scraped_at.isoformat()
        elif not scraped_at:
            scraped_at = datetime.now(timezone.utc).isoformat()
        else:
            scraped_at = str(scraped_at)

        return {
            "source": source,
            "title": title,
            "location": location,
            "city": city,
            "district": district,
            "property_type": record.get("property_type") or record.get("property_category"),
            "sale_or_rent": record.get("sale_or_rent", "sale"),
            "description": description,
            "price": price,
            "currency": currency,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "area": area,
            "area_unit": record.get("area_unit", "SQM"),
            "amenities": amenities,
            "source_url": source_url,
            "luxury_brand": record.get("luxury_brand"),
            "development_type": record.get("development_type"),
            "status": record.get("status"),
            "completion_date": record.get("completion_date"),
            "total_units": DataCleaner.parse_int(record.get("total_units")),
            "scraped_at": scraped_at
        }
