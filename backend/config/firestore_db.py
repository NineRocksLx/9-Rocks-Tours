import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
import asyncio

if not firebase_admin._apps:
    ROOT_DIR = Path(__file__).parent.parent
    cred_path = ROOT_DIR / 'google-calendar-key.json'
    print(f"A carregar credenciais de: {cred_path.resolve()}") # ADICIONE ESTA LINHA
    try:
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred, {'projectId': 'tours-81516-acfbc'})
    except Exception as e:
        raise ImportError(f"Erro ao inicializar Firebase: {e}")

db = firestore.client()
tours_collection = db.collection("tours")

async def get_async_query(query):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: list(query.stream()))

__all__ = ["tours_collection", "get_async_query"]