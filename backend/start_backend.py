import subprocess
import sys
import time
import requests
from pathlib import Path

def check_backend_running():
    """Verifica se o backend já está a correr"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend():
    """Inicia o backend FastAPI"""
    print("🚀 A iniciar 9 Rocks Tours Backend...")
    
    if check_backend_running():
        print("✅ Backend já está a correr em http://localhost:8000")
        return True
    
    try:
        # Mudar para a pasta backend
        backend_path = Path(__file__).parent
        
        # Instalar dependências se necessário
        print("📦 A verificar dependências...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      cwd=backend_path, check=True)
        
        # Iniciar FastAPI
        print("🔄 A iniciar servidor FastAPI...")
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", "--port", "8000", "--reload"
        ], cwd=backend_path)
        
        # Aguardar inicialização
        print("⏳ A aguardar inicialização...")
        for i in range(30):  # 30 segundos máximo
            time.sleep(1)
            if check_backend_running():
                print("✅ Backend iniciado com sucesso!")
                print("📊 API: http://localhost:8000")
                print("📚 Docs: http://localhost:8000/docs")
                print("🗺️ Sitemap: http://localhost:8000/sitemap.xml")
                return True
            print(f"⏳ Tentativa {i+1}/30...")
        
        print("❌ Timeout na inicialização")
        return False
        
    except Exception as e:
        print(f"❌ Erro ao iniciar backend: {e}")
        return False

if __name__ == "__main__":
    start_backend()