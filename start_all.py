import subprocess
import sys
import time
import threading
from pathlib import Path

def run_backend():
    """Correr backend em thread separada"""
    print("🔥 A iniciar Backend...")
    backend_path = Path("backend")
    subprocess.run([sys.executable, "start_backend.py"], cwd=backend_path)

def run_frontend():
    """Correr frontend em thread separada"""
    print("🎨 A iniciar Frontend...")
    time.sleep(10)  # Aguardar backend inicializar
    frontend_path = Path("frontend")
    subprocess.run([sys.executable, "start_frontend.py"], cwd=frontend_path)

def main():
    print("🚀 9 ROCKS TOURS - COPY PERSUASIVO ATIVADO!")
    print("=" * 60)
    print("🔥 Backend FastAPI: http://localhost:8000")
    print("🎨 Frontend React: http://localhost:3000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    # Iniciar backend e frontend em paralelo
    backend_thread = threading.Thread(target=run_backend)
    frontend_thread = threading.Thread(target=run_frontend)
    
    backend_thread.start()
    frontend_thread.start()
    
    # Aguardar ambos terminarem
    backend_thread.join()
    frontend_thread.join()
    
    print("✅ 9 Rocks Tours iniciado com sucesso!")

if __name__ == "__main__":
    main()