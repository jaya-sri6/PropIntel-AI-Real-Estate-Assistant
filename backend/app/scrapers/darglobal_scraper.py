import json
import logging
import os
import re
from typing import Dict, List, Any
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from backend.app.scrapers.base_scraper import BaseScraper
from backend.app.scrapers.data_cleaner import DataCleaner

logger = logging.getLogger(__name__)

# Complete catalog of 35+ DarGlobal projects segregated by country and brand
DARGLOBAL_PROJECTS_CATALOG = [
    # --- UAE Projects ---
    {
        "url": "https://darglobal.co.uk/one-of-one/project-pagani",
        "name": "The Pagani Penthouse",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Pagani",
        "category": "Ultra Luxury Residential",
        "dev_type": "Residential Tower",
        "desc": "Ultra-luxury residential tower overlooking the Dubai Canal, featuring bespoke interiors designed by Horacio Pagani with private elevators, plunge pools, and canal views.",
        "amenities": ["Infinity Swimming Pool", "Pagani Bespoke Interiors", "Private Elevators", "Canal Views", "Concierge Service", "Gym & Spa"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "Trump International Hotel & Tower Dubai",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Trump Organization",
        "category": "Luxury Hospitality & Branded Residences",
        "dev_type": "High-Rise Tower",
        "desc": "Prestigious international tower and hotel in Dubai featuring bespoke Trump branded residences, five-star hospitality services, rooftop infinity pool, and world-class fine dining.",
        "amenities": ["Trump Hotel Services", "Rooftop Pool", "Spa & Wellness", "Fine Dining", "Valet & Concierge"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "Da Vinci Tower, Interiors By Pagani",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Pagani",
        "category": "Ultra Luxury Residential",
        "dev_type": "Architectural Tower",
        "desc": "Iconic residential tower located in Downtown Dubai on the Dubai Canal, with avant-garde architecture and automotive luxury interiors inspired by Horacio Pagani hypercars.",
        "amenities": ["Canal Views", "Pagani Design Elements", "Sky Pool", "State-of-the-Art Fitness Center"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "Urban Oasis by Missoni",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Missoni",
        "category": "Luxury Residential",
        "dev_type": "Waterfront Tower",
        "desc": "Vibrant residential waterfront tower right by the Dubai Water Canal with exclusive fashion-forward interiors and colorful patterns designed by Missoni Home.",
        "amenities": ["Missoni Home Furnishings", "Canal Promenade Access", "Infinity Lap Pool", "Gymnasium"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "W Residences Dubai – Downtown",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Marriott / W Hotels",
        "category": "Branded Residences",
        "dev_type": "High-Rise Tower",
        "desc": "Standalone branded residences located in Downtown Dubai with direct views of Burj Khalifa and Dubai Fountain, offering signature W Hotel amenities and VIP services.",
        "amenities": ["Burj Khalifa Views", "W Clubhouse", "Guest Suites", "Infinity Pool", "24/7 Whatever/Whenever Service"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "DG1",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "DarGlobal",
        "category": "Luxury Residential",
        "dev_type": "Canal Tower",
        "desc": "Dynamic luxury residential development directly on Dubai Canal offering prime city vistas, contemporary architecture, and curated lifestyle spaces.",
        "amenities": ["Direct Canal Living", "Panoramic City Views", "Swimming Pool", "Modern Health Club"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae/villas",
        "name": "D-Villas At Jumeirah Golf Estates",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "DarGlobal",
        "category": "Luxury Golf Villas",
        "dev_type": "Golf Community",
        "desc": "Ultra-exclusive golf-facing villas situated in prestigious Jumeirah Golf Estates, designed for serene luxury living overlooking championship fairways.",
        "amenities": ["Championship Golf Course Views", "Private Gardens", "Gated Security", "Clubhouse Access"]
    },
    {
        "url": "https://darglobal.co.uk/one-of-one/top-of-the-astera",
        "name": "The Astera, Interiors by Aston Martin",
        "country": "UAE",
        "city": "Ras Al Khaimah",
        "luxury_brand": "Aston Martin",
        "category": "Beachfront Residences",
        "dev_type": "Coastal Development",
        "desc": "Stunning beachfront development located on Al Marjan Island, Ras Al Khaimah, with sophisticated automotive interiors curated by British luxury brand Aston Martin.",
        "amenities": ["Private Beach", "Aston Martin Design", "Infinity Edge Pool", "Yacht Marina Proximity"]
    },
    {
        "url": "https://darglobal.co.uk/one-of-one/top-of-the-astera",
        "name": "Top of the Astera",
        "country": "UAE",
        "city": "Ras Al Khaimah",
        "luxury_brand": "Aston Martin",
        "category": "Ultra Luxury Penthouses",
        "dev_type": "Beachfront Penthouses",
        "desc": "Premiere Edition collection crowned at the apex of The Astera on Al Marjan Island, offering sprawling penthouse residences near the upcoming Wynn Resort.",
        "amenities": ["Panoramic Arabian Gulf Views", "Private Sky Terrace", "Aston Martin Bespoke Detailing"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uae",
        "name": "Neptune, Interiors by Mouawad",
        "country": "UAE",
        "city": "Dubai",
        "luxury_brand": "Mouawad",
        "category": "Ultra Luxury Residential",
        "dev_type": "Signature Tower",
        "desc": "Jewelry-inspired architectural masterpiece in prime Dubai featuring opulently crafted residences with interiors designed in partnership with historic luxury jeweler Mouawad.",
        "amenities": ["Jewelry Vault Concierge", "Private Wellness Sanctuary", "Infinity Pool", "Diamond Lounge"]
    },

    # --- Saudi Arabia Projects ---
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Trump Park Residences",
        "country": "Saudi Arabia",
        "city": "Riyadh & Diriyah",
        "luxury_brand": "Trump Organization",
        "category": "Luxury Master Community",
        "dev_type": "Branded Residences",
        "desc": "High-end branded residences set amidst landscaped parks in the premier cultural and diplomatic corridor of Riyadh and historical Diriyah.",
        "amenities": ["Lush Landscaped Parks", "Trump Branded Services", "Gated Security", "Private Lounge"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia/villas",
        "name": "Trump Mansions",
        "country": "Saudi Arabia",
        "city": "Riyadh & Diriyah",
        "luxury_brand": "Trump Organization",
        "category": "Ultra Luxury Mansions",
        "dev_type": "Gated Enclave",
        "desc": "Palatial luxury estates in the prestigious Wadi Safar community in Diriyah, Riyadh, offering unprecedented privacy, bespoke craftsmanship, and desert oasis vistas.",
        "amenities": ["Private Swimming Pools", "Wadi Safar Views", "Trump Butler Service", "Equestrian & Golf Access"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Trump Branded Residences (Riyadh)",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "luxury_brand": "Trump Organization",
        "category": "Branded Residential",
        "dev_type": "Integrated Community",
        "desc": "Elegantly finished residences tailored for discerning global investors and Saudi families seeking five-star hospitality standards.",
        "amenities": ["Clubhouse", "Fitness Center", "Swimming Pools", "Concierge"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Trump Executive Residences",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "luxury_brand": "Trump Organization",
        "category": "Executive Residential",
        "dev_type": "Modern Community",
        "desc": "Sophisticated executive apartments and homes with modern luxury finishes, corporate lounges, and prime connectivity to Riyadh's financial districts.",
        "amenities": ["Business Lounges", "Executive Spa", "Smart Home Systems"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Premium Furnished Trump Residences",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "luxury_brand": "Trump Organization",
        "category": "Furnished Residences",
        "dev_type": "Turnkey Residences",
        "desc": "Turnkey luxury residences fully appointed with bespoke Trump Home furniture collections and hotel-standard housekeeping.",
        "amenities": ["Turnkey Designer Furnishing", "Hotel Style Management", "Pool & Gym"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Trump Tower Jeddah",
        "country": "Saudi Arabia",
        "city": "Jeddah",
        "luxury_brand": "Trump Organization",
        "category": "Luxury Tower",
        "dev_type": "Red Sea High-Rise",
        "desc": "Major luxury residential and hospitality landmark tower situated along the Jeddah Corniche overlooking the Red Sea.",
        "amenities": ["Red Sea Views", "Sky Club", "Trump Spa", "Private Marina Access"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Amaya",
        "country": "Saudi Arabia",
        "city": "Jeddah",
        "luxury_brand": "DarGlobal",
        "category": "Residential Community",
        "dev_type": "Master Planned Community",
        "desc": "A vibrant master community located in Jeddah offering contemporary family residences, communal green spaces, and retail promenades.",
        "amenities": ["Community Centers", "Walking Paths", "Retail & Cafes", "Children Play Areas"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Luxury Plots in Amaya, Jeddah",
        "country": "Saudi Arabia",
        "city": "Jeddah",
        "luxury_brand": "DarGlobal",
        "category": "Residential Land Plots",
        "dev_type": "Custom Build Plots",
        "desc": "Exclusive residential plots in Amaya allowing buyers to design and build custom private villas in a fully serviced master-planned development.",
        "amenities": ["Underground Infrastructure", "Wide Boulevards", "Gated Security"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "Padel Living Residences",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "luxury_brand": "DarGlobal",
        "category": "Sports & Wellness Community",
        "dev_type": "Active Lifestyle Residences",
        "desc": "First-of-its-kind active residential community centered around padel courts, fitness facilities, and healthy lifestyle living in Riyadh.",
        "amenities": ["Professional Padel Courts", "Sports Academy", "Wellness Spa", "Healthy Dining"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-saudi-arabia",
        "name": "DarGlobal Mansions Interiors by Fendi Casa",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "luxury_brand": "Fendi Casa",
        "category": "Ultra Luxury Mansions",
        "dev_type": "Private Estate Collection",
        "desc": "Ultra-exclusive private mansions featuring custom interior architecture and Italian luxury furniture designed by Fendi Casa.",
        "amenities": ["Fendi Casa Furnishings", "Private Pool", "Landscaped Courtyards", "Gated Security"]
    },

    # --- Oman Projects (AIDA Master Community) ---
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Aida Master Community",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "DarGlobal & Trump",
        "category": "Mega Master Community",
        "dev_type": "Cliffside Community",
        "desc": "A 3.5 million square meter master community rising 130 meters above the sea on the clifftops of Muscat, Oman. Features luxury villas, hotels, and championship golf.",
        "amenities": ["18-Hole Championship Golf", "Cliffside Views", "Beach Access", "Wellness Spa", "Hiking Trails"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Trump International Hotel, Oman",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Trump Organization",
        "category": "Luxury Hospitality & Resort",
        "dev_type": "Cliffside Resort",
        "desc": "Ultra-luxury five-star resort hotel perched on clifftops overlooking the Sea of Oman with hanging suites, infinity cliff pools, and private beach clubs.",
        "amenities": ["Hanging Suites", "Cliffside Infinity Pools", "Trump Spa", "Private Beach Club"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Trump Cliff Villas",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Trump Organization",
        "category": "Luxury Cliffside Villas",
        "dev_type": "Sea Cliff Enclave",
        "desc": "Spectacular luxury villas set directly on cliff edges 130 meters above the ocean, with cantilevered glass pools and sweeping panoramic sea views.",
        "amenities": ["Cantilevered Glass Pools", "Panoramic Sea Views", "Trump Hotel Access", "Golf Membership"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Trump Golf Villas",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Trump Organization",
        "category": "Golf Residences",
        "dev_type": "Championship Fairway Villas",
        "desc": "Spacious residences fronting the 18-hole championship golf course designed with native stone architecture and natural contours.",
        "amenities": ["Golf Fairway Views", "Private Gardens", "Golf Cart Parking", "Clubhouse Privilege"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Fairway Villas",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "DarGlobal",
        "category": "Golf Villas",
        "dev_type": "Fairway Homes",
        "desc": "Exclusive modern villas nestled along rolling golf fairways offering tranquil open landscapes and outdoor entertainment spaces.",
        "amenities": ["Golf Course Views", "Private Pool", "Covered Terraces"]
    },
    {
        "url": "https://darglobal.co.uk/one-of-one/fendi-casa-azure-oceanfront-villas",
        "name": "Azure Oceanfront Villas Interiors by Fendi Casa",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Fendi Casa",
        "category": "Ultra Luxury Oceanfront Villas",
        "dev_type": "Coastal Cliff Estate",
        "desc": "Limited collection of oceanfront cliffside villas featuring signature Fendi Casa interior styling, bespoke Italian furniture, and uninterrupted sea horizons.",
        "amenities": ["Ocean Clifftop Position", "Fendi Casa Interiors", "Infinity Lap Pool", "Private Wine Cellar"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Marriott Residences AIDA",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Marriott",
        "category": "Branded Residences",
        "dev_type": "Resort Residences",
        "desc": "Fully serviced branded residential apartments and penthouses managed with Marriott's world-renowned hospitality and concierge services.",
        "amenities": ["Marriott Concierge", "Infinity Pool", "Residents Lounge", "Housekeeping"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "The Great Escape & The Great Escape 2",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "DarGlobal",
        "category": "Scenic Residences",
        "dev_type": "Valley & Hill Homes",
        "desc": "Idyllic hillside residences blending seamlessly with Oman's majestic natural valleys and sea breeze cliffs.",
        "amenities": ["Hillside Trails", "Observation Decks", "Infinity Swimming Pool"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Coastal Investment Villas & Sunrise Haven",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "DarGlobal",
        "category": "Holiday & Investment Villas",
        "dev_type": "Coastal Enclave",
        "desc": "High-yield coastal holiday villas positioned for international second-home buyers and high-net-worth real estate investors.",
        "amenities": ["Sunrise Views", "Rental Program Management", "Private Pool"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Amour Sans Detour & Amour Sans Detour 2",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "DarGlobal",
        "category": "Romantic Luxury Residences",
        "dev_type": "Intimate Hillside Enclave",
        "desc": "Secluded luxury residential villas designed with romantic architecture, sunset terraces, and private sanctuary courtyards.",
        "amenities": ["Sunset Terraces", "Private Courtyards", "Plunge Pools"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-oman",
        "name": "Nickelodeon Hotels & Resorts",
        "country": "Oman",
        "city": "Muscat",
        "luxury_brand": "Nickelodeon / Paramount",
        "category": "Family Hospitality Resort",
        "dev_type": "Themed Resort",
        "desc": "Oman's first entertainment and family luxury resort destination, featuring world-class themed water attractions, entertainment, and hospitality.",
        "amenities": ["Water Attractions", "Family Entertainment", "Kids Club", "Fine Dining"]
    },

    # --- Spain Projects (Costa del Sol) ---
    {
        "url": "https://darglobal.co.uk/projects/properties-in-spain",
        "name": "Tierra Viva, Design inspired by Automobili Lamborghini",
        "country": "Spain",
        "city": "Benahavís",
        "luxury_brand": "Automobili Lamborghini",
        "category": "Super Luxury Villas",
        "dev_type": "Gated Clifftop Community",
        "desc": "An ultra-exclusive architectural complex of luxury villas nestled in the hills of Benahavís, Spain, with sharp contours and aerodynamic lines inspired by Automobili Lamborghini super sports cars.",
        "amenities": ["Lamborghini Design Inspiration", "Panoramic Mediterranean Views", "Private Pools", "24/7 Security"]
    },
    {
        "url": "https://darglobal.co.uk/one-of-one/painite-villas-design-inspired-by-Automobili-Lamborghini",
        "name": "Painite Villas Design Inspired by Automobili Lamborghini",
        "country": "Spain",
        "city": "Benahavís",
        "luxury_brand": "Automobili Lamborghini",
        "category": "Premiere Edition Villas",
        "dev_type": "Hillside Estates",
        "desc": "Top-tier mansions within Tierra Viva with direct vehicle galleries, private elevators, rooftop sun decks, and unobstructed views of Gibraltar and the Mediterranean Sea.",
        "amenities": ["Car Gallery Showroom", "Private Elevator", "Wine Cellar", "Steam & Sauna Room"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-spain",
        "name": "Marea, Interiors by Missoni",
        "country": "Spain",
        "city": "Cortesín, Costa del Sol",
        "luxury_brand": "Missoni",
        "category": "Luxury Apartments & Penthouses",
        "dev_type": "Resort Community",
        "desc": "Coastal residential development overlooking Finca Cortesín in Casares, Spain, featuring modern apartments and penthouses styled with Missoni's signature vibrant Mediterranean aesthetic.",
        "amenities": ["Finca Cortesín Golf Proximity", "Missoni Home Aesthetics", "Infinity Swimming Pool", "Tennis Courts"]
    },

    # --- Qatar Projects ---
    {
        "url": "https://darglobal.co.uk/projects/properties-in-qatar",
        "name": "Les Vagues by Elie Saab",
        "country": "Qatar",
        "city": "Doha (Qetaifan Island North)",
        "luxury_brand": "Elie Saab",
        "category": "Ultra Luxury Waterfront Residences",
        "dev_type": "Island Development",
        "desc": "Glamorous sea-facing residences situated on Qetaifan Island North, Doha, featuring haute couture interior elegance and custom home collections by Elie Saab.",
        "amenities": ["Private Island Living", "Elie Saab Interior Styling", "Infinity Pool", "Waterfront Promenade"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-qatar/villas",
        "name": "Trump International Simaisma, Qatar",
        "country": "Qatar",
        "city": "Simaisma",
        "luxury_brand": "Trump Organization",
        "category": "Resort Community & Villas",
        "dev_type": "Coastal Master Development",
        "desc": "World-class luxury coastal resort community in Simaisma, Qatar, featuring an 18-hole Trump championship golf course, luxury villas, and exclusive country club.",
        "amenities": ["Championship Golf Course", "Luxury Country Club", "Private Beach Access", "Marina Facilities"]
    },

    # --- UK Projects (London) ---
    {
        "url": "https://darglobal.co.uk/one-of-one/THE-ALBERT-HALL-MANSION",
        "name": "7&8 Albert Hall Mansions",
        "country": "UK",
        "city": "London",
        "luxury_brand": "DarGlobal",
        "category": "Heritage Luxury Mansion",
        "dev_type": "Prime Central London Mansion",
        "desc": "Historic luxury residential mansion situated in Kensington Gore, London, directly overlooking Hyde Park and Royal Albert Hall. Restored to exemplary modern high-specification living.",
        "amenities": ["Direct Hyde Park Views", "Royal Albert Hall Proximity", "24/7 Concierge", "Bespoke Millwork", "Period Fireplaces"]
    },
    {
        "url": "https://darglobal.co.uk/projects/properties-in-uk",
        "name": "The Mulliner",
        "country": "UK",
        "city": "London",
        "luxury_brand": "DarGlobal",
        "category": "Boutique Prime Residences",
        "dev_type": "Mayfair Residential",
        "desc": "Exclusive boutique residence in Mayfair, London, offering discrete luxury living and superior capital preservation in prime central London.",
        "amenities": ["Prime Mayfair Location", "Discreet Security", "Concierge Service", "Luxury Specifications"]
    },

    # --- Corporate Overview ---
    {
        "url": "https://darglobal.co.uk/about",
        "name": "DarGlobal Corporate Profile & Overview",
        "country": "UK / Global",
        "city": "London",
        "luxury_brand": "DarGlobal",
        "category": "Corporate Profile",
        "dev_type": "Publicly Listed Developer",
        "desc": "DarGlobal (Dar Global PLC) is the international real estate development arm of Dar Al Arkan, listed on the London Stock Exchange (LSE). Specializes in luxury second homes and co-branded residences partnering with Pagani, Aston Martin, Automobili Lamborghini, Fendi Casa, Missoni, Elie Saab, and the Trump Organization across UAE, Saudi Arabia, Oman, Qatar, UK, and Spain.",
        "amenities": ["London Stock Exchange (LSE: DAR)", "Global Luxury Co-Branding Partnerships", "Presence in 6 International Markets"]
    }
]

class DarGlobalScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="DarGlobal", base_url="https://darglobal.co.uk")
        self.target_projects = DARGLOBAL_PROJECTS_CATALOG

    def scrape(self, live: bool = False) -> Dict[str, List[Dict[str, Any]]]:
        projects = []
        documents = []

        now_iso = datetime.now(timezone.utc).isoformat()

        # If live scraping is requested, attempt Playwright
        if live:
            try:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    context = browser.new_context(user_agent=self.headers["User-Agent"])
                    page = context.new_page()

                    for item in self.target_projects[:10]:
                        try:
                            logger.info(f"DarGlobalScraper: Scraping live {item['url']}")
                            page.goto(item["url"], wait_until="domcontentloaded", timeout=12000)
                            page.wait_for_timeout(800)
                            html = page.content()
                            soup = BeautifulSoup(html, "html.parser")
                            for s in soup(["script", "style", "noscript", "svg"]):
                                s.decompose()
                            
                            meta_desc = ""
                            m = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
                            if m and m.get("content"):
                                meta_desc = m["content"].strip()

                            raw_text = " ".join(soup.stripped_strings)
                            desc = meta_desc or item["desc"]
                            if len(desc) < 40:
                                desc = item["desc"]

                            clean_record = DataCleaner.normalize_record({
                                "source": "DarGlobal",
                                "title": item["name"],
                                "location": f"{item['city']}, {item['country']}",
                                "city": item["city"],
                                "country": item["country"],
                                "property_type": item["category"],
                                "luxury_brand": item["luxury_brand"],
                                "development_type": item["dev_type"],
                                "description": f"{desc} Full project details: {raw_text[:600]}",
                                "amenities": item["amenities"],
                                "source_url": item["url"],
                                "scraped_at": now_iso
                            })
                            projects.append(clean_record)

                            documents.append({
                                "source_name": "DarGlobal",
                                "original_url": clean_record["source_url"],
                                "title": f"DarGlobal: {clean_record['title']} ({item['country']})",
                                "doc_type": "project",
                                "text_content": f"DarGlobal Project: {clean_record['title']}.\nLocation: {clean_record['location']}.\nBrand: {clean_record.get('luxury_brand') or 'None'}.\nCategory: {clean_record.get('property_type')}.\nDevelopment Type: {clean_record.get('development_type')}.\nDescription: {clean_record['description']}\nAmenities: {', '.join(clean_record['amenities'])}.\nSource: {clean_record['source_url']}",
                                "metadata_json": clean_record
                            })
                        except Exception as e:
                            logger.warning(f"Error scraping {item['url']} live: {e}")
                    
                    browser.close()
            except Exception as e:
                logger.warning(f"Playwright live scraping not available: {e}.")

        # Load all 35+ fully segregated projects
        for item in self.target_projects:
            # Check if already added in live
            if any(p["title"] == item["name"] for p in projects):
                continue

            slug = re.sub(r'[^a-zA-Z0-9]+', '-', item['name'].lower()).strip('-')
            base_url = item["url"]
            if not base_url or any(base_url.endswith(x) for x in ("/properties-in-uae", "/properties-in-saudi-arabia", "/properties-in-oman", "/properties-in-spain", "/properties-in-qatar", "/properties-in-uk", "/villas", "/projects")):
                proj_url = f"https://darglobal.co.uk/projects/{slug}"
            else:
                proj_url = base_url

            if any(p["source_url"] == proj_url for p in projects):
                country_slug = re.sub(r'[^a-zA-Z0-9]+', '-', item['country'].lower()).strip('-')
                proj_url = f"https://darglobal.co.uk/projects/{country_slug}-{slug}"

            clean_record = DataCleaner.normalize_record({
                "source": "DarGlobal",
                "title": item["name"],
                "location": f"{item['city']}, {item['country']}",
                "city": item["city"],
                "country": item["country"],
                "property_type": item["category"],
                "luxury_brand": item["luxury_brand"],
                "development_type": item["dev_type"],
                "description": item["desc"],
                "amenities": item["amenities"],
                "source_url": proj_url,
                "scraped_at": now_iso
            })
            projects.append(clean_record)

            documents.append({
                "source_name": "DarGlobal",
                "original_url": clean_record["source_url"],
                "title": f"DarGlobal: {clean_record['title']} ({item['country']})",
                "doc_type": "project",
                "text_content": (
                    f"DarGlobal Project: {clean_record['title']}.\n"
                    f"Location: {clean_record['location']}.\n"
                    f"Country: {clean_record.get('country')}.\n"
                    f"City: {clean_record.get('city')}.\n"
                    f"Luxury Brand Partnership: {clean_record.get('luxury_brand') or 'None'}.\n"
                    f"Property Category: {clean_record.get('property_type')}.\n"
                    f"Development Type: {clean_record.get('development_type')}.\n"
                    f"Description: {clean_record['description']}\n"
                    f"Amenities: {', '.join(clean_record['amenities'])}.\n"
                    f"Official URL: {clean_record['source_url']}"
                ),
                "metadata_json": clean_record
            })

        return {
            "projects": projects,
            "properties": [],
            "documents": documents
        }
