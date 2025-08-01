# backend/services/stripe_service.py - VERSÃO ORIGINAL COMPLETA, COM A CORREÇÃO INTEGRADA

import os
import logging
from typing import Dict, Optional, Any
from datetime import datetime

# Tenta importar a biblioteca. Se falhar, o serviço não pode funcionar.
try:
    import stripe
except ImportError:
    stripe = None

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        """Inicializar Stripe Service com configuração completa"""
        if not stripe:
            logger.error("A biblioteca 'stripe' não está instalada. O serviço Stripe não funcionará.")
            self.available = False
            return

        self.stripe = stripe
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
        print(f"STRIPE_PUBLISHABLE_KEY: {self.publishable_key}")
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        # O serviço só está disponível se as chaves principais existirem
        self.available = bool(self.secret_key and self.publishable_key)
        
        if self.available:
            self.stripe.api_key = self.secret_key
            self.stripe.api_version = "2020-08-27"
            
            self.is_test_mode = "test" in self.secret_key
            self.mode = "test" if self.is_test_mode else "live"
            self.google_pay_environment = "TEST" if self.is_test_mode else "PRODUCTION"
            self.merchant_id = os.getenv('GOOGLE_MERCHANT_ID', '00000000000000000000000')
            
            logger.info(f"✅ Stripe Service inicializado com sucesso em modo '{self.mode}'.")
            self._test_initial_connection()
        else:
            logger.warning("⚠️ Stripe Service não foi configurado. Verifique as variáveis de ambiente STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY.")

    def _test_initial_connection(self):
        """Testar conexão inicial com Stripe para validar a chave de API."""
        try:
            account = self.stripe.Account.retrieve()
            logger.info(f"✅ Conexão com a API do Stripe bem-sucedida. Account: {account.id}")
        except self.stripe.error.AuthenticationError:
            logger.error("❌ FALHA CRÍTICA: Autenticação com o Stripe falhou. A sua STRIPE_SECRET_KEY é inválida.")
            self.available = False
        except Exception as e:
            logger.error(f"❌ Falha na conexão inicial com o Stripe: {e}")
            self.available = False

    def test_connection(self) -> Dict:
        """Testar conexão Stripe com detalhes completos (mantido do seu ficheiro original)."""
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
            account = self.stripe.Account.retrieve()
            test_intent = self.stripe.PaymentIntent.create(
                amount=100,
                currency="eur",
                automatic_payment_methods={"enabled": True},
                metadata={"test": "connection_test"}
            )
            return {
                "status": "connected", "message": "Stripe conectado e funcional", "mode": self.mode,
                "google_pay_environment": self.google_pay_environment, "account_id": account.id,
                "account_country": getattr(account, 'country', 'Unknown'),
                "publishable_key": self.publishable_key[:12] + "...",
                "google_pay_merchant_id": self.merchant_id, "test_payment_intent": test_intent.id,
                "supported_payment_methods": ["card", "google_pay"], "api_version": self.stripe.api_version
            }
        except Exception as e:
            logger.error(f"❌ Erro no teste de conexão: {e}")
            return {"status": "error", "message": f"Erro na conexão: {str(e)}", "mode": self.mode, "google_pay_environment": self.google_pay_environment, "error_type": type(e).__name__}

    def get_publishable_key(self) -> str:
        """Retornar chave pública Stripe (mantido do seu ficheiro original)."""
        return self.publishable_key or ""

    def get_google_pay_config(self) -> Dict:
        """Retornar configuração completa e consistente para Google Pay (mantido do seu ficheiro original)."""
        return {
            "available": self.available, "publishable_key": self.publishable_key,
            "merchant_id": self.merchant_id, "mode": self.mode,
            "environment": self.google_pay_environment, "gateway": "stripe",
            "gateway_merchant_id": self.merchant_id, "api_version": "2020-08-27",
            "supported_networks": ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
            "supported_methods": ["PAN_ONLY", "CRYPTOGRAM_3DS"]
        }

    # =================================================================================
    # ## ❗ FUNÇÃO CRÍTICA CORRIGIDA ##
    # Esta é a função que estava a causar o erro. Foi substituída pela versão robusta.
    # =================================================================================
    def create_payment_intent(self, payment_data: Dict) -> Dict:
        """
        Cria um Payment Intent no Stripe, garantindo o formato correto dos dados e tratamento de erros.
        """
        if not self.available:
            return {"status": "error", "message": "O serviço Stripe não está configurado no servidor."}

        try:
            # 1. Validação robusta dos dados de entrada
            required_fields = ["amount", "tour_id", "booking_id", "customer_email"]
            missing_fields = [field for field in required_fields if not payment_data.get(field)]
            if missing_fields:
                raise ValueError(f"Campos obrigatórios em falta para criar o pagamento: {', '.join(missing_fields)}")

            amount = payment_data.get("amount")
            if not isinstance(amount, (int, float)) or amount <= 0:
                raise ValueError(f"O valor (amount) do pagamento é inválido: {amount}")

            # 2. ## ✅ CORREÇÃO ESSENCIAL ##
            # A API do Stripe exige o valor em cêntimos (um número inteiro).
            # Ex: 15.50€ deve ser enviado como 1550.
            amount_in_cents = int(float(amount) * 100)
            
            if amount_in_cents < 50:  # O mínimo de cobrança do Stripe é 0.50 EUR
                raise ValueError(f"O valor do pagamento ({amount_in_cents} cêntimos) é inferior ao mínimo de 50 cêntimos.")

            logger.info(f"STRIPE_SERVICE: A criar Payment Intent para {amount_in_cents} cêntimos (Booking ID: {payment_data.get('booking_id')}).")

            # 3. Preparar metadados
            metadata = {
                "booking_id": str(payment_data.get("booking_id", "N/A")),
                "tour_id": str(payment_data.get("tour_id", "N/A")),
                "customer_name": str(payment_data.get("customer_name", "N/A")),
                "customer_email": str(payment_data.get("customer_email", "N/A")),
                "source": "9rocks_tours_api"
            }
            
            # 4. Configuração do Payment Intent
            intent_config = {
                "amount": amount_in_cents,
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

            # 5. Criar o Payment Intent
            intent = self.stripe.PaymentIntent.create(**intent_config)

            logger.info(f"STRIPE_SERVICE: Payment Intent '{intent.id}' criado com sucesso.")

            # 6. ## ✅ SUCESSO ##
            # Retorna a estrutura de dados correta que o `payment_routes.py` espera.
            return {
                "status": "created",
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "amount": amount_in_cents / 100,
                "currency": "EUR",
                "metadata": metadata
            }

        except self.stripe.error.StripeError as e:
            # Captura erros específicos da biblioteca Stripe e devolve a mensagem de erro clara.
            error_message = e.user_message or str(e)
            logger.error(f"STRIPE_SERVICE: Erro da API do Stripe ao criar Payment Intent: {error_message}")
            return {"status": "error", "message": f"Erro do Stripe: {error_message}"}
        except Exception as e:
            # Captura outros erros inesperados (ex: ValueError do amount inválido).
            logger.error(f"STRIPE_SERVICE: Erro inesperado ao criar Payment Intent: {e}")
            return {"status": "error", "message": f"Erro interno na criação do pagamento: {str(e)}"}


    def confirm_payment(self, payment_intent_id: str, payment_method_data: Optional[Dict] = None) -> Dict:
        """Confirmar/verificar Payment Intent com suporte a Google Pay (mantido do seu ficheiro original)."""
        if not self.available:
            return {"status": "error", "message": "Stripe não disponível"}
        
        try:
            logger.info(f"🔍 Verificando Payment Intent: {payment_intent_id}")
            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status in ["succeeded", "processing"]:
                logger.info(f"✅ Payment Intent já processado: {intent.status}")
                return {
                    "status": intent.status, "payment_intent_id": intent.id,
                    "transaction_id": intent.charges.data[0].id if intent.charges.data else None,
                    "amount": intent.amount / 100, "currency": intent.currency.upper(),
                    "receipt_url": intent.charges.data[0].receipt_url if intent.charges.data else None,
                    "payment_method": intent.payment_method, "metadata": intent.metadata
                }
            
            if intent.status == "requires_confirmation" and payment_method_data:
                logger.info(f"🔄 Confirmando Payment Intent com payment method")
                confirmed_intent = self.stripe.PaymentIntent.confirm(
                    payment_intent_id, payment_method_data=payment_method_data
                )
                return {
                    "status": confirmed_intent.status, "payment_intent_id": confirmed_intent.id,
                    "transaction_id": confirmed_intent.charges.data[0].id if confirmed_intent.charges.data else None,
                    "amount": confirmed_intent.amount / 100, "currency": confirmed_intent.currency.upper(),
                    "receipt_url": confirmed_intent.charges.data[0].receipt_url if confirmed_intent.charges.data else None,
                    "payment_method": confirmed_intent.payment_method, "metadata": confirmed_intent.metadata
                }
            
            return {
                "status": intent.status, "payment_intent_id": intent.id,
                "amount": intent.amount / 100, "currency": intent.currency.upper(),
                "next_action": intent.next_action, "metadata": intent.metadata
            }
        except Exception as e:
            logger.error(f"❌ Erro ao confirmar Payment Intent: {e}")
            return {"status": "error", "message": f"Erro na confirmação: {str(e)}", "error_type": type(e).__name__}

    def handle_webhook(self, payload: str, signature: str) -> Dict:
        """Processar webhook Stripe (mantido do seu ficheiro original)."""
        if not self.available or not self.webhook_secret:
            return {"status": "error", "message": "Webhook não configurado"}
        
        try:
            event = self.stripe.Webhook.construct_event(payload, signature, self.webhook_secret)
            logger.info(f"📢 Webhook recebido: {event['type']}")
            
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                logger.info(f"✅ Pagamento bem-sucedido: {payment_intent['id']}")
                return {
                    "status": "success", "event_type": event['type'],
                    "payment_intent_id": payment_intent['id'], "amount": payment_intent['amount'] / 100,
                    "metadata": payment_intent['metadata']
                }
            
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                logger.warning(f"❌ Pagamento falhou: {payment_intent['id']}")
                return {
                    "status": "failed", "event_type": event['type'],
                    "payment_intent_id": payment_intent['id'], "error": payment_intent.get('last_payment_error'),
                    "metadata": payment_intent['metadata']
                }
            
            return {"status": "processed", "event_type": event['type'], "message": f"Evento {event['type']} processado"}
        except Exception as e:
            logger.error(f"❌ Erro no webhook: {e}")
            return {"status": "error", "message": f"Erro no webhook: {str(e)}"}

    def get_test_cards(self) -> Dict:
        """Retornar cartões de teste para Google Pay (mantido do seu ficheiro original)."""
        return {
            "test_cards": {
                "visa": {"number": "4242424242424242", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Visa - Sempre aprovado"},
                "visa_debit": {"number": "4000056655665556", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Visa Debit - Sempre aprovado"},
                "mastercard": {"number": "5555555555554444", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Mastercard - Sempre aprovado"},
                "mastercard_debit": {"number": "5200828282828210", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Mastercard Debit - Sempre aprovado"},
                "declined": {"number": "4000000000000002", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Cartão recusado - Para testar falhas"},
                "insufficient_funds": {"number": "4000000000009995", "exp_month": 12, "exp_year": 2025, "cvc": "123", "description": "Fundos insuficientes - Para testar falhas"}
            },
            "google_pay_test_setup": {
                "environment": self.google_pay_environment, "merchant_name": "9 Rocks Tours",
                "merchant_id": self.merchant_id, "gateway": "stripe", "gateway_merchant_id": self.merchant_id,
                "instructions": [
                    f"1. Usar ambiente {self.google_pay_environment} do Google Pay",
                    "2. Adicionar os cartões de teste acima ao Google Pay",
                    "3. Certificar que merchant_id está configurado",
                    "4. Testar em Chrome com extensão Google Pay"
                ]
            }
        }

    def create_setup_intent(self, customer_id: str) -> Dict:
        """Criar Setup Intent para configurar métodos de pagamento (mantido do seu ficheiro original)."""
        if not self.available:
            return {"status": "error", "message": "Stripe não disponível"}
        
        try:
            setup_intent = self.stripe.SetupIntent.create(
                customer=customer_id, payment_method_types=["card"], usage="off_session"
            )
            return {"status": "created", "setup_intent_id": setup_intent.id, "client_secret": setup_intent.client_secret}
        except Exception as e:
            logger.error(f"❌ Erro ao criar Setup Intent: {e}")
            return {"status": "error", "message": str(e)}

    def get_debug_info(self) -> Dict:
        """Retornar informações de debug (mantido do seu ficheiro original)."""
        return {
            "service_available": self.available, "mode": self.mode,
            "google_pay_environment": self.google_pay_environment, "is_test_mode": self.is_test_mode,
            "publishable_key_set": bool(self.publishable_key), "secret_key_set": bool(self.secret_key),
            "webhook_secret_set": bool(self.webhook_secret), "merchant_id": self.merchant_id,
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
except Exception as e:
    logger.error(f"❌ Falha crítica ao inicializar a instância do StripeService: {e}")
    stripe_service = None