# backend/config/environment.py
import os
from typing import List, Dict, Any
from pathlib import Path

class Environment:
    """Configuração centralizada para desenvolvimento vs produção"""
    
    def __init__(self):
        # Detectar environment
        self.is_development = os.getenv('DEBUG', 'False').lower() == 'true'
        self.is_production = not self.is_development
        self.environment = "DEVELOPMENT" if self.is_development else "PRODUCTION"
        
        # Detectar plataforma (local vs Render)
        self.is_render = bool(os.getenv('RENDER'))
        self.is_local = not self.is_render
        
        print(f"🌍 Environment: {self.environment}")
        print(f"🖥️  Platform: {'Render' if self.is_render else 'Local'}")

    @property
    def cors_origins(self) -> List[str]:
        """URLs permitidas para CORS"""
        if self.is_development:
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001"
            ]
        else:
            return [
                "https://9rocks.pt",
                "https://www.9rocks.pt",
                "https://ninerocks-frontend.onrender.com"  # Se frontend também estiver no Render
            ]

    @property
    def backend_url(self) -> str:
        """URL do backend"""
        if self.is_development:
            return "http://localhost:8000"
        else:
            return os.getenv('BACKEND_URL', 'https://ninerocks-backend.onrender.com')

    @property
    def frontend_url(self) -> str:
        """URL do frontend"""
        if self.is_development:
            return "http://localhost:3000"
        else:
            return os.getenv('FRONTEND_URL', 'https://9rocks.pt')

    @property
    def payment_config(self) -> Dict[str, Any]:
        """Configuração de pagamentos"""
        return {
            "paypal": {
                "mode": os.getenv('PAYPAL_MODE', 'sandbox' if self.is_development else 'live'),
                "client_id": os.getenv('PAYPAL_CLIENT_ID'),
                "client_secret": os.getenv('PAYPAL_CLIENT_SECRET')
            },
            "stripe": {
                "secret_key": os.getenv('STRIPE_SECRET_KEY'),
                "publishable_key": os.getenv('STRIPE_PUBLISHABLE_KEY'),
                "webhook_secret": os.getenv('STRIPE_WEBHOOK_SECRET'),
                "mode": "test" if self._is_stripe_test_key() else "live"
            },
            "google_pay": {
                "merchant_id": os.getenv('GOOGLE_MERCHANT_ID'),
                "environment": "TEST" if self.is_development else "PRODUCTION"
            }
        }

    def _is_stripe_test_key(self) -> bool:
        """Verificar se chave Stripe é de teste"""
        key = os.getenv('STRIPE_SECRET_KEY', '')
        return "test" in key

    @property
    def database_config(self) -> Dict[str, Any]:
        """Configuração da base de dados"""
        return {
            "firebase": {
                "project_id": os.getenv('FIREBASE_PROJECT_ID', 'tours-81516-acfbc'),
                "use_emulator": self.is_development and os.getenv('USE_FIREBASE_EMULATOR', 'False').lower() == 'true',
                "credentials_source": "environment" if self.is_production else "file"
            }
        }

    @property
    def security_config(self) -> Dict[str, Any]:
        """Configuração de segurança"""
        return {
            "enable_https_only": self.is_production,
            "enable_strict_cors": self.is_production,
            "jwt_secret": os.getenv('JWT_SECRET', 'dev-secret-key'),
            "rate_limiting": {
                "enabled": self.is_production,
                "requests_per_minute": 100 if self.is_development else 60
            }
        }

    @property
    def logging_config(self) -> Dict[str, Any]:
        """Configuração de logs"""
        return {
            "level": "DEBUG" if self.is_development else "INFO",
            "enable_file_logging": self.is_production,
            "log_payments": True,
            "log_database_queries": self.is_development
        }

    def get_webhook_urls(self) -> Dict[str, str]:
        """URLs para webhooks"""
        base_url = self.backend_url
        return {
            "stripe": f"{base_url}/webhooks/stripe",
            "paypal": f"{base_url}/webhooks/paypal"
        }

    def validate_config(self) -> Dict[str, Any]:
        """Validar configuração atual"""
        issues = []
        warnings = []
        
        # Validar PayPal
        paypal_config = self.payment_config["paypal"]
        if not paypal_config["client_id"]:
            issues.append("PAYPAL_CLIENT_ID não configurado")
        
        # Validar Stripe
        stripe_config = self.payment_config["stripe"]
        if not stripe_config["secret_key"]:
            issues.append("STRIPE_SECRET_KEY não configurado")
        
        # Verificar se chaves são adequadas para environment
        if self.is_production:
            if self._is_stripe_test_key():
                issues.append("🚨 PRODUÇÃO usando chaves Stripe de TESTE!")
            
            if paypal_config["mode"] == "sandbox":
                issues.append("🚨 PRODUÇÃO usando PayPal SANDBOX!")
        
        # Verificar CORS
        if self.is_production and "localhost" in str(self.cors_origins):
            warnings.append("⚠️ CORS inclui localhost em produção")
        
        return {
            "environment": self.environment,
            "platform": "Render" if self.is_render else "Local",
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "payment_modes": {
                "paypal": paypal_config["mode"],
                "stripe": stripe_config["mode"],
                "google_pay": self.payment_config["google_pay"]["environment"]
            }
        }

    def print_startup_summary(self):
        """Imprimir resumo na inicialização"""
        validation = self.validate_config()
        
        print("=" * 60)
        print(f"🚀 9 ROCKS TOURS - {validation['environment']} ({validation['platform']})")
        print("=" * 60)
        print(f"🌐 Backend URL: {self.backend_url}")
        print(f"🎨 Frontend URL: {self.frontend_url}")
        print(f"💳 PayPal Mode: {validation['payment_modes']['paypal']}")
        print(f"💳 Stripe Mode: {validation['payment_modes']['stripe']}")
        print(f"📱 Google Pay: {validation['payment_modes']['google_pay']}")
        
        if validation['issues']:
            print("\n❌ PROBLEMAS CRÍTICOS:")
            for issue in validation['issues']:
                print(f"   - {issue}")
        
        if validation['warnings']:
            print("\n⚠️  AVISOS:")
            for warning in validation['warnings']:
                print(f"   - {warning}")
        
        if validation['valid']:
            print("\n✅ Configuração válida!")
        
        print("=" * 60)

# Instância global
env = Environment()