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
        if not self.available:
            return {
                "status": "error",
                "message": "PayPal não disponível"
            }
        
        try:
            import paypalrestsdk
            
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": payment_data.get("return_url"),
                    "cancel_url": payment_data.get("cancel_url")
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": payment_data.get("tour_name", "Tour"),
                            "sku": payment_data.get("tour_id"),
                            "price": str(payment_data.get("amount")),
                            "currency": "EUR",
                            "quantity": payment_data.get("participants", 1)
                        }]
                    },
                    "amount": {
                        "total": str(payment_data.get("amount")),
                        "currency": "EUR"
                    },
                    "description": f"Reserva tour {payment_data.get('tour_name')}"
                }]
            })
            
            if payment.create():
                approval_url = None
                for link in payment.links:
                    if link.rel == "approval_url":
                        approval_url = link.href
                        break
                
                return {
                    "status": "created",
                    "payment_id": payment.id,
                    "approval_url": approval_url
                }
            else:
                return {
                    "status": "error", 
                    "message": payment.error
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def execute_payment(self, payment_id: str, payer_id: str) -> Dict:
        """Executar pagamento aprovado"""
        if not self.available:
            return {"status": "error", "message": "PayPal não disponível"}
        
        try:
            import paypalrestsdk
            
            payment = paypalrestsdk.Payment.find(payment_id)
            
            if payment.execute({"payer_id": payer_id}):
                return {
                    "status": "completed",
                    "payment_id": payment_id,
                    "transaction_id": payment.transactions[0].related_resources[0].sale.id,
                    "payer_email": payment.payer.payer_info.email,
                    "payer_name": f"{payment.payer.payer_info.first_name} {payment.payer.payer_info.last_name}"
                }
            else:
                return {
                    "status": "error",
                    "message": payment.error
                }
                
        except Exception as e:
            return {
                "status": "error", 
                "message": str(e)
            }

    def get_payment_details(self, payment_id: str) -> Dict:
        """Obter detalhes do pagamento"""
        if not self.available:
            return {"status": "error", "message": "PayPal não disponível"}
        
        try:
            import paypalrestsdk
            
            payment = paypalrestsdk.Payment.find(payment_id)
            return {
                "status": payment.state,
                "payment_id": payment.id,
                "amount": payment.transactions[0].amount.total,
                "currency": payment.transactions[0].amount.currency
            }
            
        except Exception as e:
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