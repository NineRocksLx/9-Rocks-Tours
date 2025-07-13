#!/usr/bin/env python3
# setup_debug.py - Script para configurar e debugar o Google Pay

import os
import sys
import json
import requests
import time
from datetime import datetime
from pathlib import Path

class GooglePayDebugger:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.issues_found = []
        self.solutions = []
        
    def print_header(self, title):
        """Imprimir header bonito"""
        print("\n" + "="*60)
        print(f"🔧 {title}")
        print("="*60)
    
    def print_step(self, step, message):
        """Imprimir passo do debug"""
        print(f"\n[Passo {step}] {message}")
        print("-" * 40)
    
    def check_environment_variables(self):
        """Verificar variáveis de ambiente"""
        self.print_step(1, "Verificando Variáveis de Ambiente")
        
        required_vars = {
            'STRIPE_SECRET_KEY': 'Chave secreta do Stripe',
            'STRIPE_PUBLISHABLE_KEY': 'Chave pública do Stripe', 
            'GOOGLE_MERCHANT_ID': 'ID do merchant Google Pay',
            'FIREBASE_PROJECT_ID': 'ID do projeto Firebase'
        }
        
        optional_vars = {
            'STRIPE_WEBHOOK_SECRET': 'Secret do webhook Stripe',
            'PAYPAL_CLIENT_ID': 'Client ID do PayPal',
            'PAYPAL_CLIENT_SECRET': 'Client Secret do PayPal'
        }
        
        print("Variáveis obrigatórias:")
        for var, description in required_vars.items():
            value = os.getenv(var)
            if value:
                # Mascarar dados sensíveis
                masked = value[:8] + "..." if len(value) > 8 else "***"
                print(f"  ✅ {var}: {masked} ({description})")
                
                # Verificar se é chave de teste
                if 'STRIPE' in var and 'test' not in value and 'pk_test' not in value and 'sk_test' not in value:
                    self.issues_found.append(f"⚠️ {var} parece ser chave de PRODUÇÃO!")
                    self.solutions.append(f"Use chaves de TEST para desenvolvimento: {var} deve começar com sk_test_ ou pk_test_")
            else:
                print(f"  ❌ {var}: NÃO CONFIGURADA ({description})")
                self.issues_found.append(f"Variável {var} não configurada")
                self.solutions.append(f"Configure {var} no arquivo .env")
        
        print("\nVariáveis opcionais:")
        for var, description in optional_vars.items():
            value = os.getenv(var)
            if value:
                masked = value[:8] + "..." if len(value) > 8 else "***"
                print(f"  ✅ {var}: {masked} ({description})")
            else:
                print(f"  ⚠️ {var}: não configurada ({description})")
    
    def check_backend_connection(self):
        """Verificar conexão com backend"""
        self.print_step(2, "Verificando Conexão com Backend")
        
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend conectado: {data.get('status')}")
                print(f"   Firebase: {data.get('firebase_status')}")
                print(f"   PayPal: {data.get('paypal_status')}")
                print(f"   Stripe: {data.get('stripe_status')}")
                print(f"   Google Pay: {'ready' if data.get('google_pay_ready') else 'not ready'}")
                
                if not data.get('google_pay_ready'):
                    self.issues_found.append("Google Pay não está pronto no backend")
                    self.solutions.append("Verificar configuração GOOGLE_MERCHANT_ID e Stripe")
            else:
                raise Exception(f"Status code: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            self.issues_found.append(f"Backend não acessível: {e}")
            self.solutions.append("Verificar se o backend está rodando em http://localhost:8000")
    
    def test_stripe_connection(self):
        """Testar conexão Stripe"""
        self.print_step(3, "Testando Conexão Stripe")
        
        try:
            response = requests.get(f"{self.backend_url}/api/payments/test/stripe", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'connected':
                    print("✅ Stripe conectado com sucesso")
                    print(f"   Mode: {data.get('mode')}")
                    print(f"   Account ID: {data.get('account_id')}")
                    print(f"   Country: {data.get('account_country')}")
                    print(f"   API Version: {data.get('api_version')}")
                else:
                    print(f"❌ Stripe não conectado: {data.get('message')}")
                    self.issues_found.append("Stripe não conectado")
                    self.solutions.append("Verificar credenciais Stripe no .env")
            else:
                raise Exception(f"Status code: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro no teste Stripe: {e}")
            self.issues_found.append(f"Erro no teste Stripe: {e}")
    
    def get_google_pay_config(self):
        """Buscar configuração Google Pay"""
        self.print_step(4, "Verificando Configuração Google Pay")
        
        try:
            response = requests.get(f"{self.backend_url}/api/debug/google-pay/config", timeout=10)
            if response.status_code == 200:
                data = response.json()
                config = data.get('google_pay_config', {})
                validation = data.get('validation', {})
                
                print("✅ Configuração Google Pay obtida:")
                print(f"   Publishable Key: {'✅' if validation.get('publishable_key_valid') else '❌'}")
                print(f"   Merchant ID: {'✅' if validation.get('merchant_id_valid') else '❌'}")
                print(f"   Environment: {validation.get('environment_correct')}")
                print(f"   Mode: {validation.get('mode')}")
                
                if not validation.get('publishable_key_valid'):
                    self.issues_found.append("Publishable Key inválida")
                    self.solutions.append("Verificar STRIPE_PUBLISHABLE_KEY no .env")
                
                if not validation.get('merchant_id_valid'):
                    self.issues_found.append("Merchant ID inválido")
                    self.solutions.append("Configurar GOOGLE_MERCHANT_ID no .env")
                
                return config
            else:
                raise Exception(f"Status code: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro na configuração Google Pay: {e}")
            self.issues_found.append(f"Erro na config Google Pay: {e}")
            return None
    
    def test_payment_intent_creation(self):
        """Testar criação de Payment Intent"""
        self.print_step(5, "Testando Criação de Payment Intent")
        
        try:
            response = requests.post(f"{self.backend_url}/api/debug/stripe/create-test-intent", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    intent = data.get('intent_result', {})
                    print("✅ Payment Intent criado com sucesso")
                    print(f"   Intent ID: {intent.get('payment_intent_id')}")
                    print(f"   Status: {intent.get('status')}")
                    print(f"   Amount: €{intent.get('amount')}")
                    
                    return intent
                else:
                    print(f"❌ Falha ao criar Payment Intent: {data}")
                    self.issues_found.append("Falha na criação de Payment Intent")
            else:
                raise Exception(f"Status code: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro no teste Payment Intent: {e}")
            self.issues_found.append(f"Erro no Payment Intent: {e}")
            return None
    
    def check_frontend_files(self):
        """Verificar arquivos do frontend"""
        self.print_step(6, "Verificando Arquivos Frontend")
        
        frontend_files = [
            'frontend/src/components/PaymentComponent.js',
            'frontend/src/config/appConfig.js',
            'frontend/package.json'
        ]
        
        for file_path in frontend_files:
            if os.path.exists(file_path):
                print(f"✅ {file_path} encontrado")
                
                # Verificar conteúdo específico
                if 'PaymentComponent.js' in file_path:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'google.payments.api.PaymentsClient' in content:
                            print("   ✅ Google Pay API encontrada no código")
                        else:
                            self.issues_found.append("Google Pay API não encontrada no PaymentComponent")
                            self.solutions.append("Atualizar PaymentComponent.js com código Google Pay")
                        
                        if 'DebugLogger' in content:
                            print("   ✅ Sistema de debug encontrado")
                        else:
                            self.issues_found.append("Sistema de debug não encontrado")
                            self.solutions.append("Adicionar DebugLogger ao PaymentComponent")
            else:
                print(f"❌ {file_path} não encontrado")
                self.issues_found.append(f"Arquivo {file_path} não encontrado")
    
    def generate_test_html(self):
        """Gerar página de teste HTML"""
        self.print_step(7, "Gerando Página de Teste")
        
        html_content = """<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste Rápido Google Pay</title>
    <script src="https://pay.google.com/gp/p/js/pay.js"></script>
</head>
<body>
    <h1>Teste Rápido Google Pay</h1>
    <div id="status"></div>
    <div id="google-pay-button"></div>
    
    <script>
        async function testGooglePay() {
            try {
                const config = await fetch('http://localhost:8000/api/payments/stripe/config').then(r => r.json());
                
                if (!config.available) {
                    document.getElementById('status').innerHTML = '❌ Stripe não disponível';
                    return;
                }
                
                const paymentsClient = new google.payments.api.PaymentsClient({
                    environment: 'TEST'
                });
                
                const isReadyToPay = await paymentsClient.isReadyToPay({
                    apiVersion: 2,
                    apiVersionMinor: 0,
                    allowedPaymentMethods: [{
                        type: 'CARD',
                        parameters: {
                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            allowedCardNetworks: ['VISA', 'MASTERCARD']
                        }
                    }]
                });
                
                if (isReadyToPay.result) {
                    document.getElementById('status').innerHTML = '✅ Google Pay funcionando!';
                } else {
                    document.getElementById('status').innerHTML = '❌ Google Pay não suportado';
                }
                
            } catch (error) {
                document.getElementById('status').innerHTML = `❌ Erro: ${error.message}`;
            }
        }
        
        window.addEventListener('load', testGooglePay);
    </script>
</body>
</html>"""
        
        with open('test_google_pay.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print("✅ Página de teste criada: test_google_pay.html")
        print("   Abra no browser para testar rapidamente")
    
    def run_comprehensive_test(self):
        """Executar teste completo"""
        self.print_step(8, "Executando Teste Completo do Fluxo")
        
        try:
            response = requests.post(f"{self.backend_url}/api/payments/google-pay/test-flow", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ Teste completo bem-sucedido")
                    test_data = data.get('test_data', {})
                    print(f"   Booking ID: {test_data.get('booking_id')}")
                    print(f"   Payment Intent: {test_data.get('payment_intent_id')}")
                    print(f"   Amount: €{test_data.get('amount')}")
                    
                    return test_data
                else:
                    print(f"❌ Teste completo falhou: {data}")
                    self.issues_found.append("Teste completo falhou")
            else:
                raise Exception(f"Status code: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro no teste completo: {e}")
            self.issues_found.append(f"Erro no teste completo: {e}")
            return None
    
    def print_summary(self):
        """Imprimir resumo final"""
        self.print_header("RESUMO DO DIAGNÓSTICO")
        
        if not self.issues_found:
            print("🎉 TUDO FUNCIONANDO PERFEITAMENTE!")
            print("   Google Pay está configurado e pronto para usar.")
            print("\n📋 Próximos passos:")
            print("   1. Abrir test_google_pay.html no browser")
            print("   2. Testar no frontend principal")
            print("   3. Usar cartões de teste do Stripe")
        else:
            print(f"❌ {len(self.issues_found)} PROBLEMAS ENCONTRADOS:")
            for i, issue in enumerate(self.issues_found, 1):
                print(f"   {i}. {issue}")
            
            print(f"\n🔧 {len(self.solutions)} SOLUÇÕES SUGERIDAS:")
            for i, solution in enumerate(self.solutions, 1):
                print(f"   {i}. {solution}")
        
        print("\n📞 AJUDA:")
        print("   - Logs detalhados: /api/debug/payment-methods")
        print("   - Cartões de teste: /api/debug/stripe/test-cards")
        print("   - Configuração GP: /api/debug/google-pay/config")
        print("   - Teste completo: /api/payments/google-pay/test-flow")
    
    def run_full_diagnosis(self):
        """Executar diagnóstico completo"""
        self.print_header("DIAGNÓSTICO GOOGLE PAY - 9 ROCKS TOURS")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Backend URL: {self.backend_url}")
        
        # Executar todos os testes
        self.check_environment_variables()
        self.check_backend_connection()
        self.test_stripe_connection()
        self.get_google_pay_config()
        self.test_payment_intent_creation()
        self.check_frontend_files()
        self.generate_test_html()
        self.run_comprehensive_test()
        
        # Resumo final
        self.print_summary()

def main():
    """Função principal"""
    debugger = GooglePayDebugger()
    
    print("🚀 Iniciando diagnóstico Google Pay...")
    print("Este script verificará toda a configuração do Google Pay.")
    print("\nPressione Enter para continuar ou Ctrl+C para cancelar...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n❌ Diagnóstico cancelado.")
        return
    
    debugger.run_full_diagnosis()
    
    print("\n" + "="*60)
    print("🏁 DIAGNÓSTICO CONCLUÍDO")
    print("="*60)

if __name__ == "__main__":
    main()