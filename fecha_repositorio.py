#!/usr/bin/env python3
"""
🔒 FECHA REPOSITÓRIO - Tornar Repositório Privado
Automatiza a mudança de público para privado via GitHub API
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
        return is_private
    else:
        print(f"❌ Erro ao verificar repositório - Status: {response.status_code}")
        return None

def fechar_repositorio():
    """Tornar repositório privado"""
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    }
    
    data = {
        'private': True
    }
    
    print(f"🔒 Fechando repositório {REPO_FULL_NAME}...")
    
    response = requests.patch(API_URL, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        print("✅ SUCESSO! Repositório agora é PRIVADO")
        print("🔒 Apenas você tem acesso")
        print(f"🕐 Fechado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Log da ação
        with open('repo_visibility_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().isoformat()} - FECHADO (privado)\n")
            
        return True
    else:
        print(f"❌ ERRO ao fechar repositório - Status: {response.status_code}")
        try:
            error_data = response.json()
            print(f"💬 Mensagem: {error_data.get('message', 'Erro desconhecido')}")
        except:
            print(f"💬 Response: {response.text}")
        return False

def main():
    print("🔒 FECHA REPOSITÓRIO - GitHub API")
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
    
    if is_private:
        print("ℹ️  Repositório já é PRIVADO")
        resposta = input("🤔 Quer continuar mesmo assim? (s/N): ").lower()
        if resposta != 's':
            print("🚫 Operação cancelada")
            return
    
    # Confirmar ação
    print("\n🚨 ATENÇÃO: Esta ação irá:")
    print("   • Tornar o repositório PRIVADO")  
    print("   • Apenas você terá acesso")
    print("   • Links públicos deixarão de funcionar")
    
    confirmacao = input("\n🔒 Confirma fechar o repositório? (s/N): ").lower()
    
    if confirmacao == 's':
        if fechar_repositorio():
            print("\n🎉 Repositório fechado com sucesso!")
            print("💡 Use 'abre_repositorio.py' para tornar público novamente")
        else:
            print("\n💥 Falha ao fechar repositório")
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
# 4. IMPORTANTE: Instalar dependência:
#    pip install python-dotenv
#
# 5. Executar:
#    python fecha_repositorio.py
#
# 6. Confirmar a ação quando solicitado
#
# ⚠️  IMPORTANTE: Mantenha o token seguro no .env! Não faça commit dele.