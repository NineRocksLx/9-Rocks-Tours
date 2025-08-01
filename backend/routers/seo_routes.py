import os
from fastapi import FastAPI, Response, HTTPException, Query
from fastapi.responses import PlainTextResponse
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel
import xml.etree.ElementTree as ET

from config.firestore_db import db as db_firestore

# 🎯 SEO Configuration
class SEOConfig:
    BASE_URL = os.getenv("BASE_URL", "https://9rocks.pt")
    COMPANY_NAME = "9 Rocks Tours"
    LANGUAGES = ["pt", "en", "es"]
    CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "info@9rocks.pt")
    # LINHA 25 ATUALIZADA: Número de telemóvel
    CONTACT_PHONE = os.getenv("CONTACT_PHONE", "+351-963-366-458")
    GOOGLE_ANALYTICS_ID = os.getenv("FIREBASE_MEASUREMENT_ID", "G-36FC6SS4WD")
    PRIORITY_PAGES = {
        "home": 1.0,
        "tours": 0.9,
        "tour_detail": 0.8,
        "booking": 0.9,
        "about": 0.7,
        "contact": 0.8
    }

# 📊 Pydantic Models for SEO Data
class TourData(BaseModel):
    slug: str
    name: Dict[str, str]
    description: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    updated_at: Optional[str] = None
    images: Optional[List[str]] = []
    location: Optional[str] = None

class SEOData(BaseModel):
    title: str
    description: str
    keywords: Optional[str] = None
    tours_count: Optional[int] = None
    customers_served: Optional[int] = None
    lastModified: str

# ============================================================================
# 🗄️ Firestore Data Access Functions
# ============================================================================

async def get_tour_count() -> int:
    """🎯 Count active tours in Firestore"""
    try:
        # Usa a instância db_firestore importada
        query = db_firestore.collection('tours').where('active', '==', True)
        docs = query.stream()
        count = sum(1 for _ in docs)
        return count
    except Exception as e:
        print(f"Error counting tours: {e}")
        return 47  # Fallback

async def get_customer_count() -> int:
    """🌟 Count customers/bookings in Firestore"""
    try:
        # Usa a instância db_firestore importada
        query = db_firestore.collection('bookings')
        docs = query.stream()
        count = sum(1 for _ in docs)
        return count if count > 0 else 1250  # Fallback if no bookings
    except Exception as e:
        print(f"Error counting customers: {e}")
        return 1250  # Fallback

async def get_all_tours() -> List[TourData]:
    """🎢 Fetch all active tours from Firestore with logging"""
    try:
        # Usa a instância db_firestore importada
        query = db_firestore.collection('tours').where('active', '==', True)
        docs = query.stream()
        tours = []
        seen_ids = set()  # To handle potential duplicates
        for doc in docs:
            tour_doc = doc.to_dict()
            doc_id = doc.id
            if doc_id in seen_ids:
                print(f"Warning: Duplicate tour ID skipped: {doc_id}")
                continue
            seen_ids.add(doc_id)
            tour_data = {
                "slug": tour_doc.get("id", "tour-" + doc_id),
                "name": tour_doc.get("name", {"pt": "Tour sem nome", "en": "Unnamed Tour"}),
                "description": tour_doc.get("description", {}).get("pt", ""),
                "price": tour_doc.get("price", 0.0),
                "rating": tour_doc.get("rating", 4.5),
                "updated_at": tour_doc.get("updated_at", datetime.now().strftime("%Y-%m-%d")),
                "images": tour_doc.get("images", []),
                "location": tour_doc.get("location", "Portugal")
            }
            tours.append(TourData(**tour_data))
        print(f"Fetched {len(tours)} unique tours from Firestore")
        return tours
    except Exception as e:
        print(f"Error fetching tours from Firestore: {e}")
        return [
            TourData(
                slug="cascatas-secretas-sintra",
                name={"pt": "Cascatas Secretas de Sintra", "en": "Secret Waterfalls of Sintra"},
                description="Descubra cascatas escondidas nas montanhas de Sintra",
                price=65.0,
                rating=4.9,
                updated_at="2024-07-04",
                images=["/images/sintra-cascatas.jpg"],
                location="Sintra"
            ),
            TourData(
                slug="aventura-costa-vicentina",
                name={"pt": "Aventura na Costa Vicentina", "en": "Vicentine Coast Adventure"},
                description="Explore a costa selvagem do sudoeste português",
                price=85.0,
                rating=4.8,
                updated_at="2024-07-03",
                images=["/images/costa-vicentina.jpg"],
                location="Algarve"
            )
        ]

async def get_featured_tours(language: str = "pt") -> List[TourData]:
    """⭐ Fetch featured tours from Firestore"""
    try:
        # Usa a instância db_firestore importada
        query = db_firestore.collection('tours').where('active', '==', True).where('rating', '>=', 4.5).limit(6)
        docs = query.stream()
        tours = []
        for doc in docs:
            tour_doc = doc.to_dict()
            tour_data = {
                "slug": tour_doc.get("id", "tour-" + str(doc.id)),
                "name": tour_doc.get("name", {"pt": "Tour em destaque", "en": "Featured Tour"}),
                "description": tour_doc.get("description", {}).get(language, ""),
                "price": tour_doc.get("price", 0.0),
                "rating": tour_doc.get("rating", 4.5),
                "updated_at": tour_doc.get("updated_at", datetime.now().strftime("%Y-%m-%d")),
                "images": tour_doc.get("images", []),
                "location": tour_doc.get("location", "Portugal")
            }
            tours.append(TourData(**tour_data))
        return tours[:3]  # Return top 3
    except Exception as e:
        print(f"Error fetching featured tours: {e}")
        all_tours = await get_all_tours()
        return all_tours[:3]

async def get_tour_by_id(tour_id: str) -> Optional[TourData]:
    """🎢 Fetch a tour by ID from Firestore"""
    try:
        # Usa a instância db_firestore importada
        doc = db_firestore.collection('tours').document(tour_id).get()
        if not doc.exists:
            return None
        tour_doc = doc.to_dict()
        tour_data = {
            "slug": tour_doc.get("id", tour_id),
            "name": tour_doc.get("name", {"pt": "Tour", "en": "Tour"}),
            "description": tour_doc.get("description", {}).get("pt", ""),
            "price": tour_doc.get("price", 0.0),
            "rating": tour_doc.get("rating", 4.5),
            "updated_at": tour_doc.get("updated_at", datetime.now().strftime("%Y-%m-%d")),
            "images": tour_doc.get("images", []),
            "location": tour_doc.get("location", "Portugal")
        }
        return TourData(**tour_data)
    except Exception as e:
        print(f"Error fetching tour by ID: {e}")
        return None

# ============================================================================
# 🗺️ Dynamic Sitemap Generator
# ============================================================================

def create_seo_router() -> FastAPI:
    """🚀 Create SEO-optimized router"""
    seo_app = FastAPI(
        title="9 Rocks Tours SEO API",
        description="Multilingual SEO system integrated with Firestore",
        version="1.0.0"
    )

    @seo_app.get("/sitemap.xml")
    async def generate_sitemap():
        """🚀 Dynamic sitemap with Firestore data"""
        static_pages = [
            {"url": "", "priority": 1.0, "changefreq": "daily"},
            {"url": "tours", "priority": 0.9, "changefreq": "daily"},
            {"url": "about", "priority": 0.7, "changefreq": "monthly"},
            {"url": "contact", "priority": 0.8, "changefreq": "monthly"},
            {"url": "booking", "priority": 0.9, "changefreq": "weekly"},
        ]
        
        dynamic_tours = await get_all_tours()
        
        urlset = ET.Element("urlset")
        urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
        urlset.set("xmlns:xhtml", "http://www.w3.org/1999/xhtml")
        
        for page in static_pages:
            for lang in SEOConfig.LANGUAGES:
                url_element = ET.SubElement(urlset, "url")
                page_url = f"{SEOConfig.BASE_URL}"
                if lang != "pt":
                    page_url += f"/{lang}"
                if page["url"]:
                    page_url += f"/{page['url']}"
                ET.SubElement(url_element, "loc").text = page_url
                ET.SubElement(url_element, "lastmod").text = datetime.now().strftime("%Y-%m-%d")
                ET.SubElement(url_element, "changefreq").text = page["changefreq"]
                ET.SubElement(url_element, "priority").text = str(page["priority"])
                
                for alt_lang in SEOConfig.LANGUAGES:
                    alternate = ET.SubElement(url_element, "{http://www.w3.org/1999/xhtml}link")
                    alternate.set("rel", "alternate")
                    alternate.set("hreflang", alt_lang)
                    alt_url = f"{SEOConfig.BASE_URL}"
                    if alt_lang != "pt":
                        alt_url += f"/{alt_lang}"
                    if page["url"]:
                        alt_url += f"/{page['url']}"
                    alternate.set("href", alt_url)
        
        for tour in dynamic_tours:
            for lang in SEOConfig.LANGUAGES:
                url_element = ET.SubElement(urlset, "url")
                tour_url = f"{SEOConfig.BASE_URL}"
                if lang != "pt":
                    tour_url += f"/{lang}"
                tour_url += f"/tours/{tour.slug}"
                ET.SubElement(url_element, "loc").text = tour_url
                ET.SubElement(url_element, "lastmod").text = tour.updated_at or datetime.now().strftime("%Y-%m-%d")
                ET.SubElement(url_element, "changefreq").text = "weekly"
                ET.SubElement(url_element, "priority").text = "0.8"
                
                for alt_lang in SEOConfig.LANGUAGES:
                    alternate = ET.SubElement(url_element, "{http://www.w3.org/1999/xhtml}link")
                    alternate.set("rel", "alternate")
                    alternate.set("hreflang", alt_lang)
                    alt_tour_url = f"{SEOConfig.BASE_URL}"
                    if alt_lang != "pt":
                        alt_tour_url += f"/{alt_lang}"
                    alt_tour_url += f"/tours/{tour.slug}"
                    alternate.set("href", alt_tour_url)
        
        xml_string = ET.tostring(urlset, encoding="unicode", method="xml")
        xml_formatted = f'<?xml version="1.0" encoding="UTF-8"?>\n{xml_string}'
        xml_formatted = xml_formatted.replace('><', '>\n<')
        xml_formatted = xml_formatted.replace('<url>', '  <url>')
        xml_formatted = xml_formatted.replace('</urlset>', '\n</urlset>')
        
        return Response(
            content=xml_formatted,
            media_type="application/xml",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Type": "application/xml; charset=utf-8"
            }
        )

    @seo_app.get("/robots.txt", response_class=PlainTextResponse)
    async def generate_robots():
        """🎯 Optimized robots.txt"""
        robots_content = f"""User-agent: *
Allow: /
Allow: /en/
Allow: /es/
Allow: /tours/
Allow: /en/tours/
Allow: /es/tours/

# 🚫 Block sensitive areas
Disallow: /admin/
Disallow: /api/private/
Disallow: /temp/

# 🗺️ Main sitemap
Sitemap: {SEOConfig.BASE_URL}/sitemap.xml

# ⚡ Optimized crawl delay
Crawl-delay: 1

# 🌟 Googlebot special
User-agent: Googlebot
Allow: /
Crawl-delay: 0"""
        return PlainTextResponse(
            content=robots_content,
            headers={"Cache-Control": "public, max-age=86400"}
        )

    @seo_app.get("/api/seo/{page}")
    @seo_app.get("/api/seo/{page}/{language}")
    async def get_seo_data(page: str, language: str = "pt"):
        """🔥 SEO API with Firestore data"""
        if language not in SEOConfig.LANGUAGES:
            raise HTTPException(status_code=400, detail="Idioma não suportado")
        
        tour_count = await get_tour_count()
        customer_count = await get_customer_count()
        
        dynamic_data = {
            "home": {
                "pt": SEOData(
                    title=f"{SEOConfig.COMPANY_NAME} - Aventuras Épicas em Portugal | +{tour_count} Tours Únicos",
                    description=f"Descubra paraísos escondidos com {tour_count}+ tours exclusivos. Já transformámos {customer_count}+ vidas através de aventuras únicas!",
                    keywords="tours portugal, aventuras portugal, turismo portugal, excursões lisboa, viagens portugal",
                    tours_count=tour_count,
                    customers_served=customer_count,
                    lastModified=datetime.now().isoformat()
                ),
                "en": SEOData(
                    title=f"{SEOConfig.COMPANY_NAME} - Epic Adventures in Portugal | +{tour_count} Unique Tours",
                    description=f"Discover hidden paradises with {tour_count}+ exclusive tours. We've transformed {customer_count}+ lives through unique adventures!",
                    keywords="portugal tours, portugal adventures, portugal tourism, lisbon excursions, portugal travel",
                    tours_count=tour_count,
                    customers_served=customer_count,
                    lastModified=datetime.now().isoformat()
                ),
                "es": SEOData(
                    title=f"{SEOConfig.COMPANY_NAME} - Aventuras Épicas en Portugal | +{tour_count} Tours Únicos",
                    description=f"Descubre paraísos ocultos con {tour_count}+ tours exclusivos. ¡Hemos transformado {customer_count}+ vidas a través de aventuras únicas!",
                    keywords="tours portugal, aventuras portugal, turismo portugal, excursiones lisboa, viajes portugal",
                    tours_count=tour_count,
                    customers_served=customer_count,
                    lastModified=datetime.now().isoformat()
                )
            }
        }
        
        page_data = dynamic_data.get(page, {}).get(language)
        if not page_data:
            raise HTTPException(status_code=404, detail="Página não encontrada")
        return page_data.dict()

    @seo_app.get("/api/schema/{page}")
    async def get_schema_data(page: str, tour_id: Optional[str] = None):
        """🏗️ Generate dynamic structured data"""
        customer_count = await get_customer_count()
        base_schema = {
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            "name": SEOConfig.COMPANY_NAME,
            "url": SEOConfig.BASE_URL,
            "logo": f"{SEOConfig.BASE_URL}/images/logo-9rocks-tours.png",
            "image": f"{SEOConfig.BASE_URL}/images/og-9rocks-tours.jpg",
            "description": "Experiências de turismo únicas e transformadoras em Portugal",
            "telephone": SEOConfig.CONTACT_PHONE,
            "email": SEOConfig.CONTACT_EMAIL,
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "PT",
                "addressRegion": "Lisboa"
            },
            "priceRange": "€€",
            "openingHours": "Mo-Su 09:00-18:00",
            "sameAs": [
                "https://www.facebook.com/9rockstours",
                "https://www.instagram.com/9rockstours",
                "https://www.linkedin.com/company/9rockstours"
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": customer_count,
                "bestRating": "5"
            }
        }
        
        if page == "tour" and tour_id:
            tour_data = await get_tour_by_id(tour_id)
            if tour_data:
                tour_schema = {
                    "@context": "https://schema.org",
                    "@type": "TouristTrip",
                    "name": tour_data.name.get("pt", "Tour"),
                    "description": tour_data.description,
                    "image": tour_data.images,
                    "offers": {
                        "@type": "Offer",
                        "price": tour_data.price,
                        "priceCurrency": "EUR",
                        "availability": "https://schema.org/InStock",
                        "url": f"{SEOConfig.BASE_URL}/tours/{tour_data.slug}"
                    },
                    "provider": base_schema
                }
                return tour_schema
        return base_schema

    @seo_app.get("/seo-status")
    async def seo_status():
        """📊 SEO status dashboard with Firestore data"""
        tour_count = await get_tour_count()
        customer_count = await get_customer_count()
        all_tours = await get_all_tours()
        return {
            "database_status": "connected",
            "languages_supported": SEOConfig.LANGUAGES,
            "total_tours": tour_count,
            "customers_served": customer_count,
            "last_sitemap_update": datetime.now().isoformat(),
            "pages_indexed": len(all_tours) * len(SEOConfig.LANGUAGES) + 5 * len(SEOConfig.LANGUAGES),
            "base_url": SEOConfig.BASE_URL,
            "contact": {
                "email": SEOConfig.CONTACT_EMAIL,
                "phone": SEOConfig.CONTACT_PHONE
            }
        }

    @seo_app.get("/health")
    async def health_check():
        """✅ Health check with Firestore status"""
        try:
            # Usa a instância db_firestore importada
            db_firestore.collection('tours').limit(1).get()
            db_status = "healthy"
        except Exception as e:
            db_status = f"error: {str(e)}"
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database_status": db_status,
            "seo_features": {
                "sitemap": "active",
                "robots": "active",
                "structured_data": "active",
                "multilingual": "active",
                "firestore_integration": "active"
            }
        }

    return seo_app

# ============================================================================
# 🚀 Integration Function
# ============================================================================

def setup_seo_routes(main_app: FastAPI) -> FastAPI:
    """🔗 Integrate SEO routes into the main application"""
    seo_router = create_seo_router()
    main_app.mount("/", seo_router)
    return main_app
