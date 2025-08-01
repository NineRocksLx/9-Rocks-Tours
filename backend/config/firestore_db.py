# config/firestore_db.py

import firebase_admin
from firebase_admin import firestore
import asyncio

# ✅ CORREÇÃO CRÍTICA: Este ficheiro já não tenta inicializar a aplicação.
# Ele assume que a inicialização já foi feita no main.py e apenas
# obtém o cliente da base de dados.

# Verifica se a aplicação Firebase foi inicializada antes de obter o cliente.
if not firebase_admin._apps:
    raise RuntimeError(
        "A aplicação Firebase Admin não foi inicializada. "
        "Certifique-se de que main.py a inicializa antes de importar este módulo."
    )

try:
    # Apenas obtém o cliente do Firestore da aplicação já existente.
    db = firestore.client()
    print("✅ Cliente Firestore obtido com sucesso a partir da instância existente.")

    # ✅ RESTAURADO: O seu código original para a coleção de tours e o helper async.
    # Estas linhas não causavam o erro e foram restauradas.
    tours_collection = db.collection("tours")

    async def get_async_query(query):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: list(query.stream()))

    __all__ = ["db", "tours_collection", "get_async_query"]

except Exception as e:
    print(f"❌ Erro ao obter o cliente Firestore: {e}")
    db = None
    tours_collection = None
    __all__ = ["db"]

