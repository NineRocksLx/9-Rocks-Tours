# backend/services/stripe_service.py - VERSÃO CORRIGIDA COM GOOGLE PAY

import os
import logging
from typing import Dict, Optional, Any
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        """Inicializar Stripe Service com configuração completa"""
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        # ✅ CORREÇÃO: Determinar modo e environment corretamente
        self.is_test_mode = bool(self.secret_key and "test" in self.secret_key)
        self.mode = "test" if self.is_test_mode else "live"
        self.google_pay_environment = "TEST" if self.is_test_mode else "PRODUCTION"
        self.available = bool(self.secret_key and self.publishable_key)
        
        # Google Pay Configuration
        self.merchant_id = os.getenv('GOOGLE_MERCHANT_ID', '00000000000000000000000')
        
        if self.available:
            try:
                import stripe
                stripe.api_key = self.secret_key
                
                # Configurar versão da API
                stripe.api_version = "2020-08-27"
                
                logger.info(f"✅ Stripe configurado em modo {self.mode}")
                logger.info(f"✅ Google Pay Environment: {self.google_pay_environment}")
                logger.info(f"✅ Google Pay Merchant ID: {self.merchant_id}")
                
                # Testar conexão inicial
                self._test_initial_connection()
                
            except ImportError:
                logger.error("⚠️ Stripe SDK não instalado")
                self.available = False
            except Exception as e:
                logger.error(f"❌ Erro Stripe: {e}")
                self.available = False
        else:
            logger.warning("⚠️ Stripe não configurado (faltam credenciais)")

    def _test_initial_connection(self):
        """Testar conexão inicial com Stripe"""
        try:
            import stripe
            account = stripe.Account.retrieve()
            logger.info(f"✅ Conexão Stripe OK - Account ID: {account.id}")
        except Exception as e:
            logger.error(f"❌ Falha na conexão inicial Stripe: {e}")

    def test_connection(self) -> Dict:
        """Testar conexão Stripe com detalhes completos"""
        if not self.available:
            return {
                "status": "unavailable",
                "message": "Stripe não configurado - verifique as variáveis de ambiente",
                "mode": self.mode,
                "google_pay_environment": self.google_pay_environment,
                "missing_keys": [
                    "STRIPE_SECRET_KEY" if not self.secret_key else None,
                    "STRIPE_PUBLISHABLE_KEY" if not self.publishable_key else None
                ]
            }
        
        try:
            import stripe
            
            # Teste completo
            account = stripe.Account.retrieve()
            
            # Testar criação de Payment Intent
            test_intent = stripe.PaymentIntent.create(
                amount=100,  # 1 EUR em centavos
                currency="eur",
                automatic_payment_methods={"enabled": True},
                metadata={"test": "connection_test"}
            )
            
            return {
                "status": "connected",
                "message": "Stripe conectado e funcional",
                "mode": self.mode,
                "google_pay_environment": self.google_pay_environment,
                "account_id": account.id,
                "account_country": getattr(account, 'country', 'Unknown'),
                "publishable_key": self.publishable_key[:12] + "...",
                "google_pay_merchant_id": self.merchant_id,
                "test_payment_intent": test_intent.id,
                "supported_payment_methods": ["card", "google_pay"],
                "api_version": stripe.api_version
            }
            
        except Exception as e:
            logger.error(f"❌ Erro no teste de conexão: {e}")
            return {
                "status": "error",
                "message": f"Erro na conexão: {str(e)}",
                "mode": self.mode,
                "google_pay_environment": self.google_pay_environment,
                "error_type": type(e).__name__
            }

    def get_publishable_key(self) -> str:
        """Retornar chave pública Stripe"""
        return self.publishable_key or ""

    def get_google_pay_config(self) -> Dict:
        """✅ CORREÇÃO: Retornar configuração completa e consistente para Google Pay"""
        return {
            "available": self.available,
            "publishable_key": self.publishable_key,
            "merchant_id": self.merchant_id,
            "mode": self.mode,
            "environment": self.google_pay_environment,  # ✅ Campo correto para o frontend
            "gateway": "stripe",
            "gateway_merchant_id": self.merchant_id,
            "api_version": "2020-08-27",
            "supported_networks": ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
            "supported_methods": ["PAN_ONLY", "CRYPTOGRAM_3DS"]
        }

    def create_payment_intent(self, payment_data: Dict) -> Dict:
        """Criar Payment Intent otimizado para Google Pay"""
        if not self.available:
            return {
                "status": "error",
                "message": "Stripe não disponível - serviço não configurado"
            }
        
        try:
            import stripe
            
            # Validar dados de entrada
            required_fields = ["amount", "tour_id", "booking_id", "customer_email"]
            missing_fields = [field for field in required_fields if not payment_data.get(field)]
            
            if missing_fields:
                return {
                    "status": "error",
                    "message": f"Campos obrigatórios em falta: {', '.join(missing_fields)}"
                }
            
            amount_cents = int(float(payment_data.get("amount", 0)) * 100)
            
            if amount_cents < 50:  # Mínimo Stripe é 0.50 EUR
                return {
                    "status": "error",
                    "message": "Valor mínimo é 0.50 EUR"
                }
            
            # Metadados completos
            metadata = {
                "tour_id": str(payment_data.get("tour_id", "")),
                "booking_id": str(payment_data.get("booking_id", "")),
                "customer_name": str(payment_data.get("customer_name", "")),
                "tour_name": str(payment_data.get("tour_name", "")),
                "participants": str(payment_data.get("participants", 1)),
                "created_at": datetime.utcnow().isoformat(),
                "source": "9rocks_tours_payment",
                "environment": self.google_pay_environment
            }
            
            # Configuração do Payment Intent
            intent_config = {
                "amount": amount_cents,
                "currency": "eur",
                "automatic_payment_methods": {
                    "enabled": True,
                    "allow_redirects": "never"
                },
                "metadata": metadata,
                "receipt_email": payment_data.get("customer_email"),
                "description": f"9 Rocks Tours - {payment_data.get('tour_name', 'Tour Portugal')}",
                "statement_descriptor_suffix": "9ROCKS TOURS",
                "capture_method": "automatic",
                "setup_future_usage": None
            }
            
            logger.info(f"🔄 Criando Payment Intent: {amount_cents/100}EUR para booking {payment_data.get('booking_id')}")
            
            intent = stripe.PaymentIntent.create(**intent_config)
            
            logger.info(f"✅ Payment Intent criado: {intent.id}")
            
            return {
                "status": "created",
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "amount": amount_cents / 100,
                "currency": "EUR",
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar Payment Intent: {e}")
            return {
                "status": "error",
                "message": f"Erro na criação do pagamento: {str(e)}",
                "error_type": type(e).__name__
            }

    def confirm_payment(self, payment_intent_id: str, payment_method_data: Optional[Dict] = None) -> Dict:
        """Confirmar/verificar Payment Intent com suporte a Google Pay"""
        if not self.available:
            return {"status": "error", "message": "Stripe não disponível"}
        
        try:
            import stripe
            
            logger.info(f"🔍 Verificando Payment Intent: {payment_intent_id}")
            
            # Buscar o intent atual
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Se já foi confirmado, retornar status atual
            if intent.status in ["succeeded", "processing"]:
                logger.info(f"✅ Payment Intent já processado: {intent.status}")
                
                return {
                    "status": intent.status,
                    "payment_intent_id": intent.id,
                    "transaction_id": intent.charges.data[0].id if intent.charges.data else None,
                    "amount": intent.amount / 100,
                    "currency": intent.currency.upper(),
                    "receipt_url": intent.charges.data[0].receipt_url if intent.charges.data else None,
                    "payment_method": intent.payment_method,
                    "metadata": intent.metadata
                }
            
            # Se precisa ser confirmado e temos dados do payment method
            if intent.status == "requires_confirmation" and payment_method_data:
                logger.info(f"🔄 Confirmando Payment Intent com payment method")
                
                confirmed_intent = stripe.PaymentIntent.confirm(
                    payment_intent_id,
                    payment_method_data=payment_method_data
                )
                
                return {
                    "status": confirmed_intent.status,
                    "payment_intent_id": confirmed_intent.id,
                    "transaction_id": confirmed_intent.charges.data[0].id if confirmed_intent.charges.data else None,
                    "amount": confirmed_intent.amount / 100,
                    "currency": confirmed_intent.currency.upper(),
                    "receipt_url": confirmed_intent.charges.data[0].receipt_url if confirmed_intent.charges.data else None,
                    "payment_method": confirmed_intent.payment_method,
                    "metadata": confirmed_intent.metadata
                }
            
            # Retornar status atual se não precisa confirmação
            return {
                "status": intent.status,
                "payment_intent_id": intent.id,
                "amount": intent.amount / 100,
                "currency": intent.currency.upper(),
                "next_action": intent.next_action,
                "metadata": intent.metadata
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao confirmar Payment Intent: {e}")
            return {
                "status": "error",
                "message": f"Erro na confirmação: {str(e)}",
                "error_type": type(e).__name__
            }

    def handle_webhook(self, payload: str, signature: str) -> Dict:
        """Processar webhook Stripe"""
        if not self.available or not self.webhook_secret:
            return {"status": "error", "message": "Webhook não configurado"}
        
        try:
            import stripe
            
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            logger.info(f"📢 Webhook recebido: {event['type']}")
            
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                logger.info(f"✅ Pagamento bem-sucedido: {payment_intent['id']}")
                
                return {
                    "status": "success",
                    "event_type": event['type'],
                    "payment_intent_id": payment_intent['id'],
                    "amount": payment_intent['amount'] / 100,
                    "metadata": payment_intent['metadata']
                }
            
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                logger.warning(f"❌ Pagamento falhou: {payment_intent['id']}")
                
                return {
                    "status": "failed",
                    "event_type": event['type'],
                    "payment_intent_id": payment_intent['id'],
                    "error": payment_intent.get('last_payment_error'),
                    "metadata": payment_intent['metadata']
                }
            
            return {
                "status": "processed",
                "event_type": event['type'],
                "message": f"Evento {event['type']} processado"
            }
            
        except Exception as e:
            logger.error(f"❌ Erro no webhook: {e}")
            return {
                "status": "error",
                "message": f"Erro no webhook: {str(e)}"
            }

    def get_test_cards(self) -> Dict:
        """Retornar cartões de teste para Google Pay"""
        return {
            "test_cards": {
                "visa": {
                    "number": "4242424242424242",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Visa - Sempre aprovado"
                },
                "visa_debit": {
                    "number": "4000056655665556",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Visa Debit - Sempre aprovado"
                },
                "mastercard": {
                    "number": "5555555555554444",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Mastercard - Sempre aprovado"
                },
                "mastercard_debit": {
                    "number": "5200828282828210",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Mastercard Debit - Sempre aprovado"
                },
                "declined": {
                    "number": "4000000000000002",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Cartão recusado - Para testar falhas"
                },
                "insufficient_funds": {
                    "number": "4000000000009995",
                    "exp_month": 12,
                    "exp_year": 2025,
                    "cvc": "123",
                    "description": "Fundos insuficientes - Para testar falhas"
                }
            },
            "google_pay_test_setup": {
                "environment": self.google_pay_environment,
                "merchant_name": "9 Rocks Tours",
                "merchant_id": self.merchant_id,
                "gateway": "stripe",
                "gateway_merchant_id": self.merchant_id,
                "instructions": [
                    f"1. Usar ambiente {self.google_pay_environment} do Google Pay",
                    "2. Adicionar os cartões de teste acima ao Google Pay",
                    "3. Certificar que merchant_id está configurado",
                    "4. Testar em Chrome com extensão Google Pay"
                ]
            }
        }

    def create_setup_intent(self, customer_id: str) -> Dict:
        """Criar Setup Intent para configurar métodos de pagamento"""
        if not self.available:
            return {"status": "error", "message": "Stripe não disponível"}
        
        try:
            import stripe
            
            setup_intent = stripe.SetupIntent.create(
                customer=customer_id,
                payment_method_types=["card"],
                usage="off_session"
            )
            
            return {
                "status": "created",
                "setup_intent_id": setup_intent.id,
                "client_secret": setup_intent.client_secret
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar Setup Intent: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    def get_debug_info(self) -> Dict:
        """Retornar informações de debug"""
        return {
            "service_available": self.available,
            "mode": self.mode,
            "google_pay_environment": self.google_pay_environment,
            "is_test_mode": self.is_test_mode,
            "publishable_key_set": bool(self.publishable_key),
            "secret_key_set": bool(self.secret_key),
            "webhook_secret_set": bool(self.webhook_secret),
            "merchant_id": self.merchant_id,
            "stripe_api_key_prefix": self.secret_key[:7] if self.secret_key else None,
            "environment_vars": {
                "STRIPE_SECRET_KEY": "✅" if os.getenv('STRIPE_SECRET_KEY') else "❌",
                "STRIPE_PUBLISHABLE_KEY": "✅" if os.getenv('STRIPE_PUBLISHABLE_KEY') else "❌",
                "STRIPE_WEBHOOK_SECRET": "✅" if os.getenv('STRIPE_WEBHOOK_SECRET') else "❌",
                "GOOGLE_MERCHANT_ID": "✅" if os.getenv('GOOGLE_MERCHANT_ID') else "❌"
            }
        }

# Instância global
try:
    stripe_service = StripeService()
    logger.info("✅ Stripe Service inicializado")
except Exception as e:
    logger.error(f"❌ Falha ao inicializar Stripe Service: {e}")
    stripe_service = None