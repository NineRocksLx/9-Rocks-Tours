# ============================================================================
# 🚨 FICHEIRO DE EMERGÊNCIA E DEPURAÇÃO - server_debug.py
# OBJETIVO: Isolar o problema do carregamento de tours.
# Execute diretamente com: python backend/server_debug.py
# ============================================================================

import uvicorn
import os
import sys
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. CONFIGURAÇÃO INICIAL ---
print("="*80)
print("🚀 [INICIANDO SERVIDOR DE DEPURAÇÃO] - server_debug.py")
print("="*80)


try:
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print("✅ [CONFIG] Ficheiro .env carregado com sucesso.")
    else:
        print("⚠️ [CONFIG] ALERTA: Ficheiro .env não encontrado. A usar variáveis de ambiente do sistema.")
except Exception as e:
    print(f"❌ [CONFIG] ERRO CRÍTICO ao carregar .env: {e}")
    sys.exit(1)

# Verificar se estamos em modo de desenvolvimento
IS_DEV_MODE = os.getenv("ENVIRONMENT") == "development"
if not IS_DEV_MODE:
    print("❌ [CONFIG] ERRO: Este script de depuração só pode ser executado com ENVIRONMENT=development no seu ficheiro .env")
    sys.exit(1)
else:
    print("✅ [CONFIG] Modo de desenvolvimento ATIVO.")

# --- 2. INICIALIZAÇÃO DO FIREBASE ---
try:
    print("\n--- [FIREBASE] A tentar inicializar o Firebase Admin SDK ---")
    cred_path = os.path.join(os.path.dirname(__file__), "google-calendar-key.json")
    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"O ficheiro de credenciais '{cred_path}' não foi encontrado.")

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ [FIREBASE] Firebase Admin SDK inicializado com sucesso.")
    else:
        print("✅ [FIREBASE] Firebase Admin SDK já se encontrava inicializado.")
    
    db = firestore.client()
    print("✅ [FIREBASE] Cliente Firestore pronto a ser utilizado.")
except Exception as e:
    print(f"❌ [FIREBASE] ERRO CRÍTICO AO INICIALIZAR FIREBASE: {e}")
    print("   -> Verifique o caminho e o conteúdo do seu ficheiro 'google-calendar-key.json'.")
    print("   -> Verifique as permissões da conta de serviço no Google Cloud.")
    sys.exit(1)


# --- 3. CRIAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="Servidor de Depuração - 9 Rocks Tours",
    description="Um servidor isolado para diagnosticar o problema dos tours."
)

# Configurar CORS para permitir pedidos do frontend em desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("\n✅ [FASTAPI] Servidor FastAPI criado e CORS configurado para localhost:3000.")

# --- 4. LÓGICA DE DEPURAÇÃO NO ARRANQUE ---
@app.on_event("startup")
async def startup_debug_check():
    """Verifica a conexão e os dados dos tours assim que o servidor arranca."""
    print("\n--- [DEBUG NO ARRANQUE 🚀] ---")
    print("O servidor arrancou. A fazer verificação de saúde à coleção 'tours'...")
    try:
        tours_ref = db.collection('tours')
        docs = tours_ref.limit(5).stream()
        
        tour_list = [doc.to_dict() for doc in docs]

        if not tour_list:
            print("⚠️ [DEBUG NO ARRANQUE 🚀] ALERTA: Conexão com Firestore OK, mas a coleção 'tours' está vazia ou não retornou dados.")
        else:
            print(f"✅ [DEBUG NO ARRANQUE 🚀] SUCESSO! Encontrados {len(tour_list)} tours na base de dados.")
            first_tour = tour_list[0]
            first_tour_name = first_tour.get('name', {}).get('pt', 'Nome não encontrado')
            print(f"   -> Exemplo de Tour: '{first_tour_name}'")
            print("   -> Estrutura do primeiro tour (JSON):")
            print(json.dumps(first_tour, indent=2, ensure_ascii=False))
    
    except Exception as e:
        print(f"❌ [DEBUG NO ARRANQUE 🚀] ERRO CRÍTICO: Não foi possível ler a coleção 'tours'.")
        print(f"   -> DETALHES DO ERRO: {e}")
    print("--- [FIM DO DEBUG NO ARRANQUE 🚀] ---\n")


# --- 5. A ROTA DOS TOURS ---
@app.get("/api/tours")
async def get_all_tours(active_only: bool = True, featured: bool = None):
    """Endpoint único e de depuração para buscar os tours."""
    print("\n--- [DEBUG DE ROTA ✈️ /api/tours] ---")
    print(f"Recebido pedido na rota com filtros: active_only={active_only}, featured={featured}")
    
    try:
        query = db.collection('tours')
        
        if active_only:
            print("   -> A aplicar filtro: active == True")
            query = query.where("active", "==", True)
        
        if featured is not None:
            print(f"   -> A aplicar filtro: featured == {featured}")
            query = query.where("featured", "==", featured)
            
        docs = query.stream()
        
        tours_result = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            tours_result.append(data)
        
        print(f"✅ [DEBUG DE ROTA ✈️] Foram encontrados {len(tours_result)} tours no Firestore.")

        if not tours_result:
            print("⚠️ [DEBUG DE ROTA ✈️] AVISO: A consulta não retornou tours. A enviar uma lista vazia para o frontend.")
        else:
            print(f"   -> A enviar {len(tours_result)} tours para o frontend.")
            print("   -> Exemplo do primeiro tour a ser enviado:")
            print(json.dumps(tours_result[0], indent=2, ensure_ascii=False))

        print("--- [FIM DO DEBUG DE ROTA ✈️] ---\n")
        return tours_result

    except Exception as e:
        print(f"❌ [DEBUG DE ROTA ✈️] ERRO CRÍTICO ao processar o pedido: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor ao buscar tours: {str(e)}")


# --- 6. PONTO DE ENTRADA PARA EXECUTAR O SERVIDOR ---
if __name__ == "__main__":
    print("\n--- [EXECUTAR SERVIDOR] ---")
    print("Para parar o servidor, pressione CTRL+C no terminal.")
    uvicorn.run(
        "server_debug:app",  # Nome do ficheiro (sem .py) e da variável da app
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

