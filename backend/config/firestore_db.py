import firebase_admin
from firebase_admin import firestore
import asyncio

# ✅ FUNÇÃO LAZY LOADING
def get_firestore_client():
    """Obtém o cliente Firestore de forma lazy"""
    try:
        if firebase_admin._apps:
            return firestore.client()
        else:
            print("⚠️ Firebase não inicializado ainda")
            return None
    except Exception as e:
        print(f"❌ Erro ao obter cliente Firestore: {e}")
        return None

# ✅ Variável global que será atualizada
db = get_firestore_client()

# ✅ Função para atualizar após Firebase ser inicializado
def initialize_firestore():
    global db
    db = get_firestore_client()
    return db

# ✅ Manter compatibilidade com imports existentes
tours_collection = None

async def get_async_query(query):
    if db:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: list(query.stream()))
    return []

__all__ = ["db", "tours_collection", "get_async_query", "initialize_firestore"]