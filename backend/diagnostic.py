#!/usr/bin/env python3
"""
🔍 9 Rocks Tours - Diagnostic Script
Verifica se todos os requisitos estão instalados e configurados
"""

import os
import sys
import importlib
from pathlib import Path

def check_python_version():
    """Verifica a versão do Python"""
    print("🐍 Verificando versão do Python...")
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("   ❌ ERRO: Python 3.8+ é necessário")
        return False
    else:
        print("   ✅ Versão do Python OK")
        return True

def check_required_packages():
    """Verifica se os pacotes necessários estão instalados"""
    print("\n📦 Verificando pacotes Python...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'firebase_admin',
        'python_dotenv',
        'pydantic',
        'google-api-python-client',
        'paypalrestsdk',
        'starlette'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            # Remove hífens para imports
            import_name = package.replace('-', '_').replace('_python_client', '_discovery')
            if import_name == 'python_dotenv':
                import_name = 'dotenv'
            
            importlib.import_module(import_name)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} - NÃO ENCONTRADO")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n🚨 Pacotes em falta: {', '.join(missing_packages)}")
        print("💡 Para instalar: pip install " + ' '.join(missing_packages))
        return False
    else:
        print("   ✅ Todos os pacotes necessários estão instalados")
        return True

def check_files():
    """Verifica se os arquivos necessários existem"""
    print("\n📁 Verificando arquivos...")
    
    current_dir = Path.cwd()
    required_files = [
        'server.py',
        'routers/seo_routes.py',
        'google-calendar-key.json',
        '.env'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        full_path = current_dir / file_path
        if full_path.exists():
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} - NÃO ENCONTRADO")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n🚨 Arquivos em falta: {', '.join(missing_files)}")
        return False
    else:
        print("   ✅ Todos os arquivos necessários encontrados")
        return True

def check_env_file():
    """Verifica o arquivo .env"""
    print("\n🔧 Verificando arquivo .env...")
    
    env_path = Path('.env')
    if not env_path.exists():
        print("   ❌ Arquivo .env não encontrado")
        return False
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        issues = []
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if '=' not in line:
                issues.append(f"Linha {i}: Formato inválido - {line}")
            elif line.count('=') > 1 and not ('=' in line.split('=', 1)[1]):
                # Permitir múltiplos = se estiver no valor
                pass
            
        if issues:
            print("   ❌ Problemas encontrados no .env:")
            for issue in issues:
                print(f"      {issue}")
            return False
        else:
            print("   ✅ Arquivo .env parece estar correto")
            return True
            
    except Exception as e:
        print(f"   ❌ Erro ao ler .env: {e}")
        return False

def check_firebase_config():
    """Verifica configuração do Firebase"""
    print("\n🔥 Verificando configuração Firebase...")
    
    json_path = Path('google-calendar-key.json')
    if not json_path.exists():
        print("   ❌ google-calendar-key.json não encontrado")
        print("   💡 Baixe o arquivo de credenciais do Firebase Console")
        return False
    
    try:
        import json
        with open(json_path, 'r') as f:
            config = json.load(f)
        
        required_keys = ['project_id', 'private_key', 'client_email']
        missing_keys = [key for key in required_keys if key not in config]
        
        if missing_keys:
            print(f"   ❌ Chaves em falta no JSON: {', '.join(missing_keys)}")
            return False
        else:
            print("   ✅ Configuração Firebase OK")
            return True
            
    except Exception as e:
        print(f"   ❌ Erro ao ler configuração Firebase: {e}")
        return False

def run_diagnostics():
    """Executa todos os diagnósticos"""
    print("🔍 DIAGNÓSTICO 9 ROCKS TOURS API")
    print("=" * 50)
    
    checks = [
        check_python_version(),
        check_required_packages(),
        check_files(),
        check_env_file(),
        check_firebase_config()
    ]
    
    print("\n" + "=" * 50)
    
    if all(checks):
        print("🎉 DIAGNÓSTICO COMPLETO - Tudo parece estar OK!")
        print("💡 Tente executar: uvicorn server:app --reload")
        return True
    else:
        print("🚨 PROBLEMAS ENCONTRADOS - Corrija os itens marcados com ❌")
        print("📖 Consulte a documentação para mais detalhes")
        return False

if __name__ == "__main__":
    run_diagnostics()