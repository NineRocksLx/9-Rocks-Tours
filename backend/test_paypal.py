# backend/test_paypal.py
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_paypal_connection():
    """🧪 Testar conexão PayPal"""
    print("🧪 Testando conexão PayPal...")
    
    try:
        response = requests.get(f"{BASE_URL}/payments/test/paypal")
        result = response.json()
        
        print(f"Status: {result.get('status')}")
        print(f"Modo: {result.get('mode')}")
        print(f"Mensagem: {result.get('message')}")
        
        if result.get('status') == 'success':
            print("✅ PayPal conectado com sucesso!")
            return True
        else:
            print("❌ Erro na conexão PayPal")
            return False
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def test_create_payment():
    """💳 Testar criação de pagamento"""
    print("\n💳 Testando criação de pagamento...")
    
    payment_data = {
        "amount": 65.0,
        "currency": "EUR",
        "tour_id": "tour-test-123",
        "booking_id": "booking-test-123",
        "customer_email": "test@9rockstours.com",
        "customer_name": "João Teste",
        "payment_method": "paypal",
        "return_url": "http://localhost:3000/payment/success",
        "cancel_url": "http://localhost:3000/payment/cancel"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/payments/paypal/create",
            json=payment_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Pagamento criado com sucesso!")
            print(f"Payment ID: {result.get('payment_id')}")
            print(f"URL de aprovação: {result.get('approval_url')}")
            return result
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Iniciando testes PayPal - 9 Rocks Tours")
    print("=" * 50)
    
    # Teste 1: Conexão
    if test_paypal_connection():
        # Teste 2: Criação de pagamento
        test_create_payment()
    
    print("\n" + "=" * 50)
    print("🏁 Testes concluídos")