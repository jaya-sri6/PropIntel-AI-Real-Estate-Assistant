import pytest
from backend.app.scrapers.data_cleaner import DataCleaner

def test_url_canonicalization():
    url1 = "https://darglobal.co.uk/projects/properties-in-uk/?utm_source=google&utm_medium=cpc#section"
    canonical1 = DataCleaner.canonicalize_url(url1)
    assert canonical1 == "https://darglobal.co.uk/projects/properties-in-uk"

    url2 = "http://wasalt.sa/en/villas-for-sale-in-riyadh/?"
    canonical2 = DataCleaner.canonicalize_url(url2)
    assert canonical2 == "https://wasalt.sa/en/villas-for-sale-in-riyadh"

def test_html_cleanup():
    raw_html = "<div><h1>Luxury Villa</h1><script>alert('xss');</script><p>Spacious 4 bedroom home.</p></div>"
    cleaned = DataCleaner.clean_html(raw_html)
    assert "alert" not in cleaned
    assert "Luxury Villa" in cleaned
    assert "Spacious 4 bedroom home." in cleaned

def test_number_parsing():
    assert DataCleaner.parse_float("SAR 2,150,000.50") == 2150000.50
    assert DataCleaner.parse_float(None) is None
    assert DataCleaner.parse_int("4 Bedrooms") == 4
    assert DataCleaner.parse_int("N/A") is None

def test_duplicate_fingerprint():
    fp1 = DataCleaner.generate_fingerprint("DarGlobal", "Pagani Penthouse", "Dubai", None)
    fp2 = DataCleaner.generate_fingerprint("darglobal", "  Pagani Penthouse  ", "Dubai", None)
    assert fp1 == fp2

def test_record_normalization_preserves_nulls():
    raw = {
        "source": "DarGlobal",
        "title": "Unpriced Project",
        "price": None,
        "location": "Dubai",
        "bedrooms": ""
    }
    norm = DataCleaner.normalize_record(raw)
    assert norm["price"] is None
    assert norm["bedrooms"] is None
    assert norm["title"] == "Unpriced Project"
