# backend/services/paypal_service.py - VERSÃO SEGURA

import os
from typing import Dict, Optional

class PayPalService:
    def __init__(self):
        self.client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.mode = os.getenv('PAYPAL_MODE', 'sandbox')
        self.available = bool(self.client_id and self.client_secret)
        
        if self.available:
            try:
                import paypalrestsdk
                paypalrestsdk.configure({
                    "mode": self.mode,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                })
                print(f"✅ PayPal configurado em modo {self.mode}")
            except ImportError:
                print("⚠️ PayPal SDK não instalado")
                self.available = False
            except Exception as e:
                print(f"❌ Erro PayPal: {e}")
                self.available = False
        else:
            print("⚠️ PayPal não configurado (faltam credenciais)")

    def test_connection(self) -> Dict:
        """Testar conexão PayPal"""
        if not self.available:
            return {
                "status": "unavailable",
                "message": "PayPal não configurado",
                "mode": self.mode
            }
        
        try:
            import paypalrestsdk
            # Teste simples
            return {
                "status": "connected",
                "message": "PayPal conectado",
                "mode": self.mode,
                "client_id": self.client_id[:8] + "..."
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "mode": self.mode
            }

 
    def create_payment(self, payment_data: Dict) -> Dict:
        """Criar pagamento PayPal"""
        print("--- PAYPAL SERVICE v1.1 ---")
        print(f"🔍 PayPal create_payment chamado com: {payment_data}")
        
        if not self.available:
            print("❌ PayPal não disponível")
            return {"status": "error", "message": "PayPal não disponível"}
        
        try:
            import paypalrestsdk
            
            total_amount = payment_data.get('amount', 0.0)
            
            # --- CORREÇÃO APLICADA AQUI ---
            # O depósito é um único item, independentemente dos participantes.
            # A quantidade é 1 e o preço é o valor total do depósito.
            payment_payload = {
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": payment_data.get("return_url"),
                    "cancel_url": payment_data.get("cancel_url")
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": payment_data.get("tour_name", "Depósito de Reserva"),
                            "sku": payment_data.get("booking_id", "N/A"),
                            "price": f"{total_amount:.2f}",  # Preço do item é o total
                            "currency": "EUR",
                            "quantity": 1  # A quantidade é sempre 1
                        }]
                    },
                    "amount": {
                        "total": f"{total_amount:.2f}",  # O total corresponde ao item
                        "currency": "EUR"
                    },
                    "description": f"Pagamento de depósito para a reserva do tour {payment_data.get('tour_name')}"
                }]
            }
            
            print(f"📤 Payload PayPal CORRIGIDO: {payment_payload}")
            
            payment = paypalrestsdk.Payment(payment_payload)
            
            print("🔄 Criando pagamento PayPal...")
            if payment.create():
                print(f"✅ Pagamento criado: {payment.id}")
                
                approval_url = next((link.href for link in payment.links if link.rel == "approval_url"), None)
                
                if not approval_url:
                    print("❌ URL de aprovação não encontrada")
                    return {"status": "error", "message": "URL de aprovação não encontrada"}
                
                return {
                    "status": "created",
                    "payment_id": payment.id,
                    "approval_url": approval_url
                }
            else:
                print(f"❌ Erro ao criar pagamento: {payment.error}")
                # Retorna o erro detalhado do PayPal para o frontend
                return {
                    "status": "error", 
                    "message": str(payment.error)
                }
                
        except Exception as e:
            print(f"❌ Exceção em create_payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": str(e)}



    def execute_payment(self, payment_id: str, payer_id: str) -> Dict:
        """Executar pagamento aprovado"""
        print(f"🔍 PayPal execute_payment chamado com payment_id: {payment_id}, payer_id: {payer_id}")
        
        if not self.available:
            print("❌ PayPal não disponível para execução")
            return {"status": "error", "message": "PayPal não disponível"}
        
        try:
            import paypalrestsdk
            
            print(f"🔍 Buscando pagamento: {payment_id}")
            payment = paypalrestsdk.Payment.find(payment_id)
            print(f"✅ Pagamento encontrado, estado: {payment.state}")
            
            print("🔄 Executando pagamento...")
            if payment.execute({"payer_id": payer_id}):
                print("✅ Pagamento executado com sucesso")
                
                transaction_id = payment.transactions[0].related_resources[0].sale.id
                payer_email = payment.payer.payer_info.email
                payer_name = f"{payment.payer.payer_info.first_name} {payment.payer.payer_info.last_name}"
                
                print(f"📊 Transaction ID: {transaction_id}")
                print(f"📊 Payer: {payer_name} ({payer_email})")
                
                return {
                    "status": "completed",
                    "payment_id": payment_id,
                    "transaction_id": transaction_id,
                    "payer_email": payer_email,
                    "payer_name": payer_name
                }
            else:
                print(f"❌ Erro ao executar pagamento: {payment.error}")
                return {
                    "status": "error",
                    "message": str(payment.error)
                }
                
        except Exception as e:
            print(f"❌ Exceção em execute_payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error", 
                "message": str(e)
            }

    def get_payment_details(self, payment_id: str) -> Dict:
        """Obter detalhes do pagamento"""
        print(f"🔍 PayPal get_payment_details chamado com payment_id: {payment_id}")
        
        if not self.available:
            print("❌ PayPal não disponível para consulta")
            return {"status": "error", "message": "PayPal não disponível"}
        
        try:
            import paypalrestsdk
            
            print(f"🔍 Consultando detalhes do pagamento: {payment_id}")
            payment = paypalrestsdk.Payment.find(payment_id)
            
            result = {
                "status": payment.state,
                "payment_id": payment.id,
                "amount": payment.transactions[0].amount.total,
                "currency": payment.transactions[0].amount.currency
            }
            
            print(f"✅ Detalhes obtidos: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Exceção em get_payment_details: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "message": str(e)
            }

# Instância global
try:
    paypal_service = PayPalService()
except Exception as e:
    print(f"❌ Falha ao inicializar PayPal: {e}")
    paypal_service = None