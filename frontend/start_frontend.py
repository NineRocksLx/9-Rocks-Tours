import subprocess
import sys
import time
import requests
from pathlib import Path
import json

def check_frontend_running():
    """Verifica se o frontend já está a correr"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        return True
    except:
        return False

def check_backend_health():
    """Verifica se o backend está saudável"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def create_env_file():
    """Cria ficheiro .env se não existir"""
    frontend_path = Path(__file__).parent
    env_file = frontend_path / '.env'
    
    if not env_file.exists():
        env_content = '''# 9 Rocks Tours Frontend Configuration
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_BASE_URL=https://9rocks.pt

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyD80GYkjPKfIbVW747zb3s7jXSuVfBJTe4
REACT_APP_FIREBASE_AUTH_DOMAIN=tours-81516-acfbc.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tours-81516-acfbc
REACT_APP_FIREBASE_STORAGE_BUCKET=tours-81516-acfbc.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=742946187892
REACT_APP_FIREBASE_APP_ID=1:742946187892:web:2b0d2bcb974d4564327f21

# Development
GENERATE_SOURCEMAP=false
WDS_SOCKET_PORT=3000
'''
        env_file.write_text(env_content)
        print("✅ Ficheiro .env criado")

def start_frontend():
    """Inicia o frontend React"""
    print("🚀 A iniciar 9 Rocks Tours Frontend...")
    
    if check_frontend_running():
        print("✅ Frontend já está a correr em http://localhost:3000")
        return True
    
    try:
        frontend_path = Path(__file__).parent
        
        # Criar .env se necessário
        create_env_file()
        
        # Verificar se backend está a correr
        if not check_backend_health():
            print("⚠️ Backend não está a responder em http://localhost:8000")
            print("💡 Inicie o backend primeiro: python backend/start_backend.py")
        
        # Instalar dependências se necessário
        print("📦 A verificar dependências...")
        if not (frontend_path / 'node_modules').exists():
            print("📥 A instalar dependências npm...")
            subprocess.run(["npm", "install"], cwd=frontend_path, check=True)
        
        # Iniciar React
        print("🔄 A iniciar servidor React...")
        process = subprocess.Popen(["npm", "start"], cwd=frontend_path)
        
        # Aguardar inicialização  
        print("⏳ A aguardar inicialização...")
        for i in range(60):  # 60 segundos máximo
            time.sleep(1)
            if check_frontend_running():
                print("✅ Frontend iniciado com sucesso!")
                print("🌐 Website: http://localhost:3000")
                print("📱 Copy persuasivo ativado!")
                return True
            print(f"⏳ Tentativa {i+1}/60...")
        
        print("❌ Timeout na inicialização")
        return False
        
    except Exception as e:
        print(f"❌ Erro ao iniciar frontend: {e}")
        return False

if __name__ == "__main__":
    start_frontend()