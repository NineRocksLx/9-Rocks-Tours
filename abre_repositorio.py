#!/usr/bin/env python3
"""
🌍 ABRE REPOSITÓRIO - Tornar Repositório Público  
Automatiza a mudança de privado para público via GitHub API
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# ================================
# 🔧 CONFIGURAÇÕES
# ================================

# Carregar variáveis do arquivo .env do backend
load_dotenv('backend/.env')

# GitHub Personal Access Token (deve estar definido no backend/.env)
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')

# Verificar se token foi carregado
if not GITHUB_TOKEN:
    print("❌ ERRO: GITHUB_TOKEN não encontrado!")
    print("💡 Adicione GITHUB_TOKEN=seu_token no arquivo backend/.env")
    exit(1)

# Configurações do repositório
GITHUB_USERNAME = 'NineRocksLx'  # Substitua pelo seu username
REPO_NAME = '9-Rocks-Tours'       # Nome do repositório
REPO_FULL_NAME = f"{GITHUB_USERNAME}/{REPO_NAME}"

# API URL
API_URL = f"https://api.github.com/repos/{REPO_FULL_NAME}"

def validar_token():
    """Verificar se o token é válido"""
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    response = requests.get('https://api.github.com/user', headers=headers)
    if response.status_code == 200:
        user_data = response.json()
        print(f"✅ Token válido - Usuário: {user_data.get('login')}")
        return True
    else:
        print(f"❌ Token inválido - Status: {response.status_code}")
        return False

def verificar_status_atual():
    """Verificar se o repositório é público ou privado"""
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    response = requests.get(API_URL, headers=headers)
    if response.status_code == 200:
        repo_data = response.json()
        is_private = repo_data.get('private', False)
        visibility = "🔒 PRIVADO" if is_private else "🌍 PÚBLICO"
        print(f"📊 Status atual: {visibility}")
        
        if not is_private:
            repo_url = repo_data.get('html_url', f'https://github.com/{REPO_FULL_NAME}')
            print(f"🔗 URL pública: {repo_url}")
        
        return is_private
    else:
        print(f"❌ Erro ao verificar repositório - Status: {response.status_code}")
        return None

def verificar_arquivos_sensiveis():
    """Alertar sobre arquivos sensíveis que podem estar expostos"""
    arquivos_perigosos = [
        '.env',
        'backend/.env', 
        'google-calendar-key.json',
        'backend/google-calendar-key.json',
        'config.py',
        'secrets.json'
    ]
    
    print("🚨 VERIFICAÇÃO DE SEGURANÇA:")
    print("   Certifique-se que estes arquivos NÃO estão no repositório:")
    for arquivo in arquivos_perigosos:
        print(f"   ❌ {arquivo}")
    print("   ✅ Use .gitignore para protegê-los")
    
    return input("\n🔒 Confirma que arquivos sensíveis estão protegidos? (s/N): ").lower() == 's'

def abrir_repositorio():
    """Tornar repositório público"""
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    }
    
    data = {
        'private': False
    }
    
    print(f"🌍 Abrindo repositório {REPO_FULL_NAME}...")
    
    response = requests.patch(API_URL, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        repo_data = response.json()
        repo_url = repo_data.get('html_url', f'https://github.com/{REPO_FULL_NAME}')
        
        print("✅ SUCESSO! Repositório agora é PÚBLICO")
        print("🌍 Qualquer pessoa pode ver e clonar")
        print(f"🔗 URL: {repo_url}")
        print(f"🕐 Aberto em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Log da ação
        with open('repo_visibility_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().isoformat()} - ABERTO (público) - {repo_url}\n")
        
        # Gerar links úteis
        print("\n📋 LINKS ÚTEIS:")
        print(f"   🌐 Repositório: {repo_url}")
        print(f"   📥 Clone HTTPS: git clone {repo_url}.git")
        print(f"   📄 README: {repo_url}#readme")
        
        return True
    else:
        print(f"❌ ERRO ao abrir repositório - Status: {response.status_code}")
        try:
            error_data = response.json()
            print(f"💬 Mensagem: {error_data.get('message', 'Erro desconhecido')}")
        except:
            print(f"💬 Response: {response.text}")
        return False

def main():
    print("🌍 ABRE REPOSITÓRIO - GitHub API")
    print("=" * 50)
    print(f"📂 Repositório: {REPO_FULL_NAME}")
    print("")
    
    # Verificar token
    if not validar_token():
        print("❌ Configure um token válido em GITHUB_TOKEN")
        print("💡 Adicionar no arquivo: backend/.env")
        return
    
    # Verificar status atual
    is_private = verificar_status_atual()
    if is_private is None:
        return
    
    if not is_private:
        print("ℹ️  Repositório já é PÚBLICO")
        resposta = input("🤔 Quer continuar mesmo assim? (s/N): ").lower()
        if resposta != 's':
            print("🚫 Operação cancelada")
            return
    
    # Verificação de segurança
    if not verificar_arquivos_sensiveis():
        print("🚫 Operação cancelada por segurança")
        print("💡 Verifique .gitignore e remova arquivos sensíveis antes de tornar público")
        return
    
    # Confirmar ação
    print("\n🚨 ATENÇÃO: Esta ação irá:")
    print("   • Tornar o repositório PÚBLICO")  
    print("   • Qualquer pessoa poderá ver o código")
    print("   • Será indexado pelo Google")
    print("   • Aparecerá no seu perfil público")
    
    confirmacao = input("\n🌍 Confirma abrir o repositório? (s/N): ").lower()
    
    if confirmacao == 's':
        if abrir_repositorio():
            print("\n🎉 Repositório aberto com sucesso!")
            print("💡 Use 'fecha_repositorio.py' para tornar privado novamente")
            print("🚀 Agora pode compartilhar o link com recrutadores!")
        else:
            print("\n💥 Falha ao abrir repositório")
    else:
        print("🚫 Operação cancelada pelo usuário")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🚫 Operação interrompida pelo usuário")
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")

# ================================
# 📋 INSTRUÇÕES DE USO:
# ================================
#
# 1. Criar Personal Access Token:
#    GitHub > Settings > Developer settings > Personal access tokens > Generate new token
#    Selecionar scope: 'repo' (Full control of private repositories)
#
# 2. Configurar token no backend/.env:
#    GITHUB_TOKEN=seu_token_aqui
#
# 3. Configurar username e repo name nas variáveis acima
#
# 4. IMPORTANTE: Verificar .gitignore antes de abrir!
#    Certifique-se que .env e google-calendar-key.json não estão commitados
#
# 5. Instalar dependência:
#    pip install python-dotenv
#
# 6. Executar:
#    python abre_repositorio.py
#
# 7. Confirmar a ação quando solicitado
#
# ⚠️  CRÍTICO: Sempre verificar arquivos sensíveis antes de tornar público!