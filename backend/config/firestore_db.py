import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
import asyncio
import os
import json

# ✅ ÚNICA INICIALIZAÇÃO FIREBASE - FONTE DA VERDADE
if not firebase_admin._apps:
    try:
        # Primeiro: tentar variável de ambiente (produção - Render)
        if os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON'):
            print("✅ A carregar credenciais Firebase da variável de ambiente")
            cred_dict = json.loads(os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON'))
            cred = credentials.Certificate(cred_dict)
            print("✅ Credenciais carregadas da variável de ambiente")
        else:
            # Fallback: ficheiro local (desenvolvimento)
            ROOT_DIR = Path(__file__).parent.parent
            cred_path = ROOT_DIR / 'google-calendar-key.json'
            print(f"✅ A carregar credenciais Firebase de: {cred_path.resolve()}")
            cred = credentials.Certificate(str(cred_path))
        
        firebase_admin.initialize_app(cred, {'projectId': 'tours-81516-acfbc'})
        print("✅ Firebase Admin inicializado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao inicializar Firebase: {e}")
        raise ImportError(f"Erro ao inicializar Firebase: {e}")
else:
    print("✅ Firebase Admin já estava inicializado")

# ✅ INSTÂNCIAS PARTILHADAS PARA TODA A APLICAÇÃO
db = firestore.client()
tours_collection = db.collection("tours")

async def get_async_query(query):
    """Executar query Firestore de forma assíncrona"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: list(query.stream()))

# ✅ EXPORTAR TUDO QUE OS OUTROS MÓDULOS PRECISAM
__all__ = ["db", "tours_collection", "get_async_query"]