import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uvicorn

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# ============================================================================
# 🚀 Aplicação FastAPI Simplificada
# ============================================================================
app = FastAPI(
    title="9 Rocks Tours API",
    description="API para Tours - Versão Simplificada",
    version="1.0.0"
)

# ============================================================================
# 🔧 Middleware Básico
# ============================================================================
origins = [
    "https://www.9rocks.pt",
    "https://9rocks.pt", 
    "https://www.9rockstours.pt",
    "https://9rockstours.pt",
    "https://tours-81516-acfbc.web.app",
    "http://localhost:3000",
    "*"  # Temporário para debug
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# ============================================================================
# 🔧 Inicialização Firebase ROBUSTA
# ============================================================================
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    # Verificar se já foi inicializado
    if not firebase_admin._apps:
        logger.info("🔥 Inicializando Firebase...")
        
        # Verificar variáveis de ambiente
        project_id = os.getenv("FIREBASE_PROJECT_ID", "tours-81516")
        
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            # Usar credenciais de arquivo
            cred = credentials.ApplicationDefault()
            logger.info("📁 Usando credenciais de arquivo")
        else:
            # Usar credenciais de variável de ambiente
            firebase_config = os.getenv("FIREBASE_CONFIG")
            if firebase_config:
                import json
                config_dict = json.loads(firebase_config)
                cred = credentials.Certificate(config_dict)
                logger.info("🔑 Usando credenciais de variável")
            else:
                # Fallback para credenciais padrão
                cred = credentials.ApplicationDefault()
                logger.info("⚠️ Usando credenciais padrão")
        
        firebase_admin.initialize_app(cred, {
            'projectId': project_id
        })
        
        logger.info("✅ Firebase inicializado com sucesso")
    else:
        logger.info("♻️ Firebase já estava inicializado")
        
    # Obter cliente Firestore
    db_firestore = firestore.client()
    logger.info("✅ Firestore cliente obtido")
    
except Exception as e:
    logger.error(f"❌ Erro ao inicializar Firebase: {e}")
    db_firestore = None

# ============================================================================
# 🔧 Health Check e Debug Endpoints (ANTES DOS ROUTERS)
# ============================================================================
@app.get("/")
async def root():
    """Health check básico"""
    return {"message": "9 Rocks Tours API - Online", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check detalhado"""
    try:
        firebase_ok = db_firestore is not None
        
        if firebase_ok:
            # Teste simples do Firestore
            test_doc = db_firestore.collection('tours').limit(1).get()
            firestore_ok = True
        else:
            firestore_ok = False
            
        return {
            "status": "healthy" if firebase_ok and firestore_ok else "degraded",
            "firebase_initialized": firebase_ok,
            "firestore_connection": firestore_ok,
            "timestamp": "2025-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

# ✅ ENDPOINT DE DEBUG COM PATH ESPECÍFICO PARA NÃO CONFLITUAR
@app.get("/debug/firestore-status")
async def debug_firestore():
    """Debug do Firestore"""
    try:
        if not db_firestore:
            return {
                "firestore_connected": False,
                "error": "Firestore não inicializado",
                "total_tours": 0
            }
            
        tours_ref = db_firestore.collection('tours')
        docs = tours_ref.limit(1).get()
        
        # Contar tours
        all_docs = tours_ref.get()
        total_count = len(all_docs)
        
        sample_tour = None
        if docs:
            sample_tour = docs[0].to_dict()
            
        return {
            "firestore_connected": True,
            "total_tours": total_count,
            "sample_tour_exists": sample_tour is not None,
            "sample_tour_fields": list(sample_tour.keys()) if sample_tour else [],
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Firestore debug error: {e}")
        return {
            "firestore_connected": False,
            "error": str(e),
            "total_tours": 0
        }

# ============================================================================
# 🔧 Reinicializar Firestore e Importar Routers (DEPOIS DO FIREBASE)
# ============================================================================
try:
    # ✅ REINICIALIZAR FIRESTORE_DB APÓS FIREBASE ESTAR PRONTO
    from config.firestore_db import initialize_firestore
    initialize_firestore()
    logger.info("✅ Firestore_db reinicializado")
    
    # ✅ AGORA IMPORTAR ROUTERS
    from routers.tours_fixed import router as tours_router
    app.include_router(tours_router, prefix="/api/tours", tags=["tours"])
    logger.info("✅ Tours router carregado")
    
    from routers.config_routes import router as config_router
    app.include_router(config_router, prefix="/api/config", tags=["config"])
    logger.info("✅ Config router carregado")

    from routers.hero_images_routes import router as hero_router  
    app.include_router(hero_router, prefix="/api/hero-images", tags=["hero-images"])
    logger.info("✅ Hero images router carregado")
    
    from routers.booking_routes import router as booking_router
    app.include_router(booking_router, prefix="/api/bookings", tags=["bookings"])
    logger.info("✅ Booking router carregado")
    
    from routers.admin_routes import router as admin_router
    app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
    logger.info("✅ Admin router carregado")
    
except Exception as e:
    logger.error(f"❌ Erro ao carregar routers: {e}")
    import traceback
    logger.error(f"❌ Traceback: {traceback.format_exc()}")

# ============================================================================
# 🔧 Handler de Erros Global
# ============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Erro global: {exc}")
    logger.error(f"❌ Request URL: {request.url}")
    logger.error(f"❌ Request method: {request.method}")
    import traceback
    logger.error(f"❌ Traceback completo: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno: {str(exc)}"}
    )

# ============================================================================
# 🔧 Startup Event
# ============================================================================
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 API iniciada com sucesso")
    logger.info(f"🔥 Firebase status: {'✅ OK' if db_firestore else '❌ ERRO'}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)