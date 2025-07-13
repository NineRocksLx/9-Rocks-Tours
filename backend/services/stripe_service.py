# backend/services/stripe_service.py - VERSÃO SEGURA

import os
from typing import Dict, Optional

class StripeService:
    def __init__(self):
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
        self.mode = "test" if self.secret_key and "test" in self.secret_key else "live"
        self.available = bool(self.secret_key and self.publishable_key)
        
        if self.available:
            try:
                import stripe
                stripe.api_key = self.secret_key
                print(f"✅ Stripe configurado em modo {self.mode}")
            except ImportError:
                print("⚠️ Stripe SDK não instalado")
                self.available = False
            except Exception as e:
                print(f"❌ Erro Stripe: {e}")
                self.available = False
        else:
            print("⚠️ Stripe não configurado (faltam credenciais)")

    def test_connection(self) -> Dict:
        """Testar conexão Stripe"""
        if not self.available:
            return {
                "status": "unavailable",
                "message": "Stripe não configurado",
                "mode": self.mode
            }
        
        try:
            import stripe
            # Teste simples
            stripe.Account.retrieve()
            return {
                "status": "connected",
                "message": "Stripe conectado",
                "mode": self.mode,
                "publishable_key": self.publishable_key[:12] + "..."
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "mode": self.mode
            }

    def get_publishable_key(self) -> str:
        """Retornar chave pública"""
        return self.publishable_key or ""

    def create_payment_intent(self, payment_data: Dict) -> Dict:
        """Criar Payment Intent"""
        if not self.available:
            return {
                "status": "error",
                "message": "Stripe não disponível"
            }
        
        try:
            import stripe
            
            intent = stripe.PaymentIntent.create(
                amount=int(payment_data.get("amount", 0) * 100),  # Centavos
                currency="eur",
                metadata={
                    "tour_id": payment_data.get("tour_id"),
                    "booking_id": payment_data.get("booking_id"),
                    "customer_name": payment_data.get("customer_name"),
                    "tour_name": payment_data.get("tour_name")
                },
                receipt_email=payment_data.get("customer_email"),
                description=f"Reserva: {payment_data.get('tour_name')}"
            )
            
            return {
                "status": "created",
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def confirm_payment(self, payment_intent_id: str) -> Dict:
        """Confirmar/verificar Payment Intent"""
        if not self.available:
            return {"status": "error", "message": "Stripe não disponível"}
        
        try:
            import stripe
            
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "status": intent.status,
                "payment_intent_id": intent.id,
                "transaction_id": intent.charges.data[0].id if intent.charges.data else None,
                "amount": intent.amount / 100,
                "currency": intent.currency.upper()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

# Instância global
try:
    stripe_service = StripeService()
except Exception as e:
    print(f"❌ Falha ao inicializar Stripe: {e}")
    stripe_service = None