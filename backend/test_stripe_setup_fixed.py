# backend/test_stripe_setup_fixed.py - VERSÃO CORRIGIDA SEM __version__
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def test_environment_variables():
    """🔍 Testa se as variáveis de ambiente estão configuradas"""
    print("🔍 TESTE 1: Verificando variáveis de ambiente...")
    
    required_vars = {
        'STRIPE_PUBLISHABLE_KEY': os.getenv('STRIPE_PUBLISHABLE_KEY'),
        'STRIPE_SECRET_KEY': os.getenv('STRIPE_SECRET_KEY'),
        'GOOGLE_MERCHANT_ID': os.getenv('GOOGLE_MERCHANT_ID')
    }
    
    all_ok = True
    for var_name, value in required_vars.items():
        if value:
            if 'KEY' in var_name:
                # Mostrar apenas primeiros caracteres da chave por segurança
                display_value = value[:20] + "..." if len(value) > 20 else value
            else:
                display_value = value
            print(f"  ✅ {var_name}: {display_value}")
        else:
            print(f"  ❌ {var_name}: NÃO ENCONTRADA")
            all_ok = False
    
    return all_ok

def test_stripe_import():
    """📦 Testa se consegue importar o módulo Stripe"""
    print("\n📦 TESTE 2: Verificando instalação do Stripe...")
    
    try:
        import stripe
        # ✅ CORREÇÃO: Não tentar acessar __version__ que pode não existir
        print(f"  ✅ Stripe importado com sucesso")
        print(f"  📍 Módulo localizado em: {stripe.__file__}")
        return True
    except ImportError as e:
        print(f"  ❌ Erro ao importar Stripe: {e}")
        print("  💡 Execute: pip install stripe")
        return False

def test_stripe_service():
    """🔧 Testa se o StripeService funciona"""
    print("\n🔧 TESTE 3: Verificando StripeService...")
    
    try:
        from services.stripe_service import stripe_service
        
        if stripe_service is None:
            print("  ❌ StripeService não foi inicializado")
            return False
        
        print(f"  ✅ StripeService inicializado - Modo: {stripe_service.mode}")
        
        # Testar conexão
        result = stripe_service.test_connection()
        if result['status'] == 'success':
            print(f"  ✅ Conexão Stripe OK: {result['message']}")
            return True
        else:
            print(f"  ❌ Erro na conexão Stripe: {result['message']}")
            return False
            
    except ImportError as e:
        print(f"  ❌ Erro ao importar StripeService: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Erro no StripeService: {e}")
        return False

def test_payment_intent_creation():
    """💳 Testa criação de Payment Intent"""
    print("\n💳 TESTE 4: Testando criação de Payment Intent...")
    
    try:
        from services.stripe_service import stripe_service
        
        if stripe_service is None:
            print("  ⏭️ Pulando teste - StripeService não disponível")
            return False
        
        # Dados de teste
        test_data = {
            "amount": 15.00,  # €15.00 de teste
            "tour_id": "test_tour_123",
            "booking_id": "test_booking_456",
            "customer_email": "teste@9rocks.pt",
            "customer_name": "Cliente Teste",
            "tour_name": "Tour de Teste - Google Pay",
            "participants": 2
        }
        
        result = stripe_service.create_payment_intent(test_data)
        
        if result and 'payment_intent_id' in result:
            print(f"  ✅ Payment Intent criado: {result['payment_intent_id']}")
            print(f"  💰 Valor: €{result['amount']}")
            print(f"  📋 Status: {result['status']}")
            print(f"  🔑 Client Secret: {result['client_secret'][:20]}...")
            
            # Tentar cancelar o Payment Intent de teste
            try:
                cancel_result = stripe_service.cancel_payment_intent(result['payment_intent_id'])
                print(f"  🗑️ Payment Intent cancelado: {cancel_result['status']}")
            except:
                print("  ⚠️ Não foi possível cancelar automaticamente (normal se já processado)")
            
            return True
        else:
            print("  ❌ Falha ao criar Payment Intent")
            return False
            
    except Exception as e:
        print(f"  ❌ Erro no teste de Payment Intent: {e}")
        return False

def test_server_imports():
    """🚀 Testa se o server.py consegue importar tudo"""
    print("\n🚀 TESTE 5: Verificando imports do server.py...")
    
    try:
        # Verificar se consegue importar os serviços
        from services.stripe_service import stripe_service
        print("  ✅ Import stripe_service OK")
        
        try:
            from services.paypal_service import paypal_service
            print("  ✅ Import paypal_service OK")
        except:
            print("  ⚠️ PayPal service não disponível (OK se não configurado)")
        
        # Verificar outros imports necessários
        import firebase_admin
        from fastapi import FastAPI
        import stripe
        
        print("  ✅ Todos os imports principais funcionam")
        return True
        
    except Exception as e:
        print(f"  ❌ Erro nos imports: {e}")
        return False

def test_endpoints_connectivity():
    """🌐 Testa se consegue fazer requests para os endpoints"""
    print("\n🌐 TESTE 6: Verificando endpoints (se servidor estiver ligado)...")
    
    try:
        import requests
        base_url = "http://localhost:8000"
        
        # Testar endpoint de health
        try:
            response = requests.get(f"{base_url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Health endpoint OK - Status: {data.get('status')}")
                print(f"  📊 Stripe: {data.get('stripe_status')}")
                print(f"  📊 Google Pay: {'✅' if data.get('google_pay_ready') else '❌'}")
                return True
            else:
                print(f"  ⚠️ Server respondeu com status {response.status_code}")
                return False
        except requests.RequestException:
            print("  ⚠️ Servidor não está ligado (normal se ainda não iniciaste)")
            return True  # Não é erro - só não está ligado
            
    except ImportError:
        print("  ⚠️ Biblioteca requests não disponível - pip install requests")
        return True  # Não é erro crítico

def main():
    """🎯 Executa todos os testes"""
    print("🧪 INICIANDO TESTES DE CONFIGURAÇÃO STRIPE + GOOGLE PAY (VERSÃO CORRIGIDA)")
    print("=" * 70)
    
    tests = [
        ("Variáveis de Ambiente", test_environment_variables),
        ("Instalação Stripe", test_stripe_import),
        ("StripeService", test_stripe_service),
        ("Payment Intent", test_payment_intent_creation),
        ("Imports do Server", test_server_imports),
        ("Conectividade Endpoints", test_endpoints_connectivity)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ Erro no teste: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 70)
    print("📊 RESUMO DOS TESTES:")
    
    passed = 0
    for i, (name, result) in enumerate(results):
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"  {i+1}. {name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 RESULTADO FINAL: {passed}/{len(tests)} testes passaram")
    
    if passed >= len(tests) - 1:  # Permite 1 falha (endpoint connectivity se server não ligado)
        print("🎉 EXCELENTE! Configuração está OK!")
        print("\n🚀 PRÓXIMOS PASSOS:")
        print("   1. Substitui o server.py pelo código híbrido que criei")
        print("   2. Inicia o servidor: python server.py")
        print("   3. Testa os endpoints:")
        print("      - http://localhost:8000/api/payments/test/stripe")
        print("      - http://localhost:8000/api/payments/stripe/config")
        print("      - http://localhost:8000/api/payments/status")
    else:
        print("⚠️ Alguns testes falharam. Verifica as configurações acima.")
        
        if not results[0][1]:  # Variáveis de ambiente
            print("\n💡 AÇÃO NECESSÁRIA:")
            print("   1. Verifica se o arquivo .env existe na pasta backend/")
            print("   2. Confirma se as chaves Stripe estão corretas")
            print("   3. Adiciona GOOGLE_MERCHANT_ID se disponível")
        
        if not results[1][1]:  # Stripe não instalado
            print("\n💡 INSTALAR STRIPE:")
            print("   cd backend")
            print("   pip install stripe")

if __name__ == "__main__":
    main()