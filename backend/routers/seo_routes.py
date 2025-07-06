from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import firebase_admin
from firebase_admin import firestore
import os
from datetime import datetime
from typing import List

router = APIRouter()

def get_firestore_client():
    """Get Firestore client - reuse from main app"""
    if firebase_admin._apps:
        return firestore.client()
    return None

def generate_sitemap_xml(base_url: str, tours: List[dict]) -> str:
    """Generate sitemap XML content"""
    
    # Cabeçalho XML
    xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'''
    
    # Homepage
    xml_content += f'''
    <url>
        <loc>{base_url}</loc>
        <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>'''
    
    # Página de tours
    xml_content += f'''
    <url>
        <loc>{base_url}/tours</loc>
        <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>'''
    
    # Cada tour individual
    for tour in tours:
        tour_id = tour.get('id', '')
        updated_at = tour.get('updated_at')
        
        # Converter data se necessário
        if updated_at:
            if hasattr(updated_at, 'strftime'):
                lastmod = updated_at.strftime('%Y-%m-%d')
            else:
                lastmod = datetime.now().strftime('%Y-%m-%d')
        else:
            lastmod = datetime.now().strftime('%Y-%m-%d')
        
        xml_content += f'''
    <url>
        <loc>{base_url}/tours/{tour_id}</loc>
        <lastmod>{lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>'''
    
    # Páginas estáticas
    static_pages = [
        {'path': '/about', 'priority': '0.7'},
        {'path': '/contact', 'priority': '0.7'},
        {'path': '/booking', 'priority': '0.6'},
    ]
    
    for page in static_pages:
        xml_content += f'''
    <url>
        <loc>{base_url}{page['path']}</loc>
        <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>{page['priority']}</priority>
    </url>'''
    
    xml_content += '''
</urlset>'''
    
    return xml_content

@router.get("/sitemap.xml")
async def get_sitemap():
    """Generate dynamic sitemap.xml from Firestore tours"""
    try:
        # Obter cliente Firestore
        db_firestore = get_firestore_client()
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        # Base URL do site
        base_url = os.environ.get('BASE_URL', 'https://9rocks.pt').rstrip('/')
        
        # Buscar tours ativos do Firestore
        tours_ref = db_firestore.collection('tours').where('active', '==', True)
        docs = tours_ref.stream()
        
        tours = []
        for doc in docs:
            tour_data = doc.to_dict()
            tour_data['id'] = doc.id
            tours.append(tour_data)
        
        # Gerar XML do sitemap
        sitemap_xml = generate_sitemap_xml(base_url, tours)
        
        # Retornar como XML
        return Response(
            content=sitemap_xml,
            media_type="application/xml",
            headers={"Content-Type": "application/xml; charset=utf-8"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sitemap: {str(e)}")

@router.get("/robots.txt")
async def get_robots():
    """Generate robots.txt"""
    base_url = os.environ.get('BASE_URL', 'https://9rocks.pt').rstrip('/')
    
    robots_content = f"""User-agent: *
Allow: /

# Sitemap
Sitemap: {base_url}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/admin/

# Allow important pages
Allow: /tours/
Allow: /about
Allow: /contact
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain"
    )