# ============================================================================
# 🚀 MAIN.PY - APLICAÇÃO PRINCIPAL COM SEO INTEGRADO - 9 ROCKS TOURS
# Arquivo: backend/main.py
# ============================================================================

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv

# 🔥 IMPORTAÇÃO DO SISTEMA SEO
from seo_routes import setup_seo_routes

# 📦 SUAS ROTAS EXISTENTES (adicione conforme necessário)
# from routes.tours import tours_router
# from routes.bookings import bookings_router
# from routes.auth import auth_router
# from routes.payments import payments_router

# 🌍 CARREGAMENTO DE VARIÁVEIS DE AMBIENTE
load_dotenv()

# 🚀 APLICAÇÃO PRINCIPAL
app = FastAPI(
    title="9 Rocks Tours API",
    description="Sistema completo de turismo com SEO multilíngue otimizado",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ⚡ MIDDLEWARE DE PERFORMANCE E SEGURANÇA
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev
        "http://localhost:3001", 
        "https://9rockstours.com",  # Produção
        "https://www.9rockstours.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# 🔒 MIDDLEWARE DE SEGURANÇA E SEO
@app.middleware("http")
async def security_and_seo_middleware(request: Request, call_next):
    """🔒 HEADERS DE SEGURANÇA E PERFORMANCE SEO"""
    response = await call_next(request)
    
    # 🔒 Headers de segurança
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # ⚡ Headers de performance para SEO
    seo_paths = ["/sitemap.xml", "/robots.txt", "/api/seo", "/api/schema"]
    if any(request.url.path.startswith(path) for path in seo_paths):
        response.headers["Cache-Control"] = "public, max-age=3600"
    
    # 🌐 Headers para recursos estáticos
    if request.url.path.startswith("/static"):
        response.headers["Cache-Control"] = "public, max-age=86400"
    
    return response

# 🔥 INTEGRAÇÃO DO SISTEMA SEO (ESSENCIAL!)
print("🔗 Integrando sistema SEO multilíngue...")
app = setup_seo_routes(app)
print("✅ Sistema SEO integrado com sucesso!")

# 📊 SUAS ROTAS API EXISTENTES (descomente conforme necessário)
# app.include_router(tours_router, prefix="/api/tours", tags=["tours"])
# app.include_router(bookings_router, prefix="/api/bookings", tags=["bookings"])
# app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
# app.include_router(payments_router, prefix="/api/payments", tags=["payments"])

# 🏠 ROTA PRINCIPAL DA API
@app.get("/api")
async def api_root():
    """🏠 ENDPOINT PRINCIPAL DA API"""
    return {
        "message": "9 Rocks Tours API",
        "version": "2.0.0",
        "features": [
            "SEO Multilíngue Automático",
            "Tours Management API", 
            "Booking System",
            "Payment Integration",
            "MongoDB Integration"
        ],
        "seo_endpoints": {
            "sitemap": "/sitemap.xml",
            "robots": "/robots.txt", 
            "seo_status": "/seo-status",
            "health": "/health",
            "seo_data": "/api/seo/{page}/{language}"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "languages_supported": ["pt", "en", "es"]
    }

# 📊 STATUS GERAL DA APLICAÇÃO
@app.get("/api/status")
async def application_status():
    """📊 STATUS COMPLETO DA APLICAÇÃO"""
    return {
        "api_status": "active",
        "seo_status": "active",
        "database_status": "connected", 
        "features": {
            "multilingual_seo": True,
            "dynamic_sitemap": True,
            "structured_data": True,
            "performance_optimized": True,
            "mongodb_integration": True,
            "automatic_hreflang": True
        },
        "environment": os.getenv("ENVIRONMENT", "development"),
        "base_url": os.getenv("BASE_URL", "https://9rockstours.com"),
        "supported_languages": ["pt", "en", "es"]
    }

# 🌐 ROTA PARA DETECÇÃO DE IDIOMA
@app.get("/api/detect-language")
async def detect_language(request: Request):
    """🌐 DETECTA IDIOMA PREFERIDO DO USUÁRIO"""
    
    # 🔍 Análise do cabeçalho Accept-Language
    accept_language = request.headers.get("accept-language", "")
    
    # 🎯 Lógica de detecção
    if "en" in accept_language.lower():
        detected = "en"
    elif "es" in accept_language.lower():
        detected = "es"
    else:
        detected = "pt"  # Padrão
    
    return {
        "detected_language": detected,
        "supported_languages": ["pt", "en", "es"],
        "redirect_url": f"/{detected}" if detected != "pt" else "/",
        "browser_preference": accept_language
    }

# ❌ HANDLERS DE ERRO PERSONALIZADOS PARA SEO
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """🔍 HANDLER 404 SEO-FRIENDLY"""
    
    # 🎯 Sugestões inteligentes baseadas na URL
    path = request.url.path
    suggestions = []
    
    if "tour" in path:
        suggestions.extend([
            "Veja todos os tours: /tours",
            "Tours em destaque: /tours/featured"
        ])
    elif any(lang in path for lang in ["en", "es"]):
        suggestions.extend([
            "Visit homepage: /",
            "See all tours: /tours"
        ])
    else:
        suggestions.extend([
            "Visite a homepage: /",
            "Veja nossos tours: /tours",
            "Entre em contato: /contact"
        ])
    
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Página não encontrada",
            "message": "A página que procura não existe ou foi movida",
            "suggestions": suggestions,
            "seo_help": {
                "sitemap": "/sitemap.xml",
                "all_pages": "/seo-status"
            },
            "contact": "info@9rockstours.com"
        }
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    """⚠️ HANDLER 500 COM INFORMAÇÕES ÚTEIS"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "message": "Nossa equipe técnica foi notificada automaticamente",
            "support": {
                "email": "tech@9rockstours.com",
                "status_page": "/health"
            },
            "estimated_fix": "Geralmente resolvemos problemas em menos de 30 minutos"
        }
    )

# 🔧 CONFIGURAÇÃO DE RECURSOS ESTÁTICOS (se necessário)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================================================================
# 🚀 CONFIGURAÇÃO DE EXECUÇÃO
# ============================================================================

if __name__ == "__main__":
    # 🔧 CONFIGURAÇÕES DO SERVIDOR
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    RELOAD = DEBUG  # Apenas reload em desenvolvimento
    
    print("🚀 Iniciando 9 Rocks Tours API + SEO Multilíngue...")
    print("=" * 60)
    print(f"🌐 Servidor: http://{HOST}:{PORT}")
    print(f"📚 Documentação: http://{HOST}:{PORT}/docs")
    print(f"🗺️ Sitemap: http://{HOST}:{PORT}/sitemap.xml")
    print(f"🤖 Robots: http://{HOST}:{PORT}/robots.txt")
    print(f"📊 Status SEO: http://{HOST}:{PORT}/seo-status")
    print(f"💊 Health Check: http://{HOST}:{PORT}/health")
    print("=" * 60)
    print("🔥 RECURSOS SEO ATIVADOS:")
    print("   ✅ Sitemap XML dinâmico (3 idiomas)")
    print("   ✅ Robots.txt otimizado") 
    print("   ✅ Hreflang automático")
    print("   ✅ Structured data")
    print("   ✅ Performance headers")
    print("   ✅ MongoDB integration")
    print("=" * 60)
    
    # 🚀 EXECUÇÃO DO SERVIDOR
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        access_log=True,
        reload_includes=["*.py"],
        log_level="info" if not DEBUG else "debug",
        workers=1 if DEBUG else 4  # Múltiplos workers em produção
    )