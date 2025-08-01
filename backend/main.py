# ============================================================================
# 📦 Importações de Módulos Essenciais
# ============================================================================
import os
import uvicorn
import firebase_admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from firebase_admin import credentials
# ❌ LINHA REMOVIDA: A importação do ProxyHeadersMiddleware foi removida por ser incompatível.
# from starlette.middleware.proxy_headers import ProxyHeadersMiddleware

# ============================================================================
# ⚙️ Configuração e Inicialização Central
# ============================================================================
# A inicialização do Firebase é feita aqui, e apenas aqui.
# Isto garante que a aplicação só é inicializada uma vez.
try:
    print("🔥 A tentar inicializar a aplicação Firebase Admin...")
    if not firebase_admin._apps:
        # A chave 'google-calendar-key.json' deve estar na raiz da pasta 'backend'
        cred_path = os.path.join(os.path.dirname(__file__), 'google-calendar-key.json')
        cred = credentials.ApplicationDefault() if os.getenv("ENVIRONMENT") == "production" else credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin inicializado com sucesso.")
    else:
        print("ℹ️ Aplicação Firebase Admin já existe.")
except Exception as e:
    print(f"❌ ERRO CRÍTICO AO INICIALIZAR FIREBASE: {e}")
    # Em caso de falha, a aplicação não deve continuar.
    exit(1)

# ============================================================================
# 🚚 Importações dos Módulos da Aplicação (DEPOIS da inicialização)
# ============================================================================
from routers import tours_fixed, config_routes, booking_routes, payment_routes, admin_routes, hero_images_routes
from services import paypal_service, stripe_service

# ============================================================================
# 🚀 Criação e Configuração da Aplicação FastAPI
# ============================================================================
app = FastAPI(title="9 Rocks Tours API")

# --- Configuração do Middleware ---

# ❌ LINHA REMOVIDA: A adição do middleware foi removida.
# app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(GZipMiddleware, minimum_size=1000)
origins = [
    "https://www.9rocks.pt",
    "https://9rocks.pt",
    "https://tours-81516-acfbc.web.app",
    "http://localhost:3000", # Para desenvolvimento local
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 🔗 Inclusão de Todas as Rotas
# ============================================================================
api_prefix = "/api"
app.include_router(tours_fixed.router, prefix=f"{api_prefix}/tours", tags=["Tours"])
app.include_router(config_routes.router, prefix=f"{api_prefix}/config", tags=["Config"])
app.include_router(booking_routes.router, prefix=f"{api_prefix}/bookings", tags=["Bookings"])
app.include_router(hero_images_routes.router, prefix=f"{api_prefix}/hero-images", tags=["Hero Images"])

# As rotas de Admin e Pagamentos podem ser adicionadas aqui conforme necessário
app.include_router(payment_routes.router, prefix=f"{api_prefix}/payments", tags=["Payments"])
app.include_router(admin_routes.router, prefix=f"{api_prefix}/admin", tags=["Admin"])


print("✅ Todos os routers da API foram montados com sucesso.")

# ============================================================================
# ❤️ Endpoint de Verificação de Saúde
# ============================================================================
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# ============================================================================
# 🌍 Lógica de Arranque do Servidor
# ============================================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)