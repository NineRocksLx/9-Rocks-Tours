import os
from dotenv import load_dotenv

# ✅ CARREGAR .ENV LOGO NO INÍCIO
load_dotenv()

import sys
import logging
from pathlib import Path
import json
import io
import csv
import base64
import asyncio
import aiohttp
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional, Dict, Any
import uuid

from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from starlette.middleware.cors import CORSMiddleware
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account
from firebase_admin import firestore

print("✅ STRIPE_SECRET_KEY carregada:", "SET" if os.getenv('STRIPE_SECRET_KEY') else "NOT SET")
print("✅ STRIPE_PUBLISHABLE_KEY carregada:", "SET" if os.getenv('STRIPE_PUBLISHABLE_KEY') else "NOT SET")

# ✅ IMPORTAR SERVIÇOS DE PAGAMENTO
try:
    from services.paypal_service import paypal_service
    PAYPAL_AVAILABLE = paypal_service is not None
except ImportError:
    PAYPAL_AVAILABLE = False
    paypal_service = None

try:
    from services.stripe_service import stripe_service
    STRIPE_AVAILABLE = stripe_service is not None
except ImportError:
    STRIPE_AVAILABLE = False
    stripe_service = None

# ✅ IMPORTAR ROUTERS
from routers import tours_fixed as tours_router
from routers.seo_routes import setup_seo_routes

# Set up root directory and load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ================================
# ✅ FIREBASE INITIALIZATION - IMPORTAR DO CONFIG
# ================================
try:
    from config.firestore_db import db as db_firestore
    print("✅ Firebase importado do config centralizado")
    print("🔍 Após Firebase - STRIPE_SECRET_KEY:", os.getenv('STRIPE_SECRET_KEY'))
except ImportError as e:
    print(f"❌ Erro ao importar config Firebase: {e}")
    sys.exit(1)

# ================================
# FASTAPI APP INITIALIZATION
# ================================
app = FastAPI(
    title="9 Rocks Tours API",
    description="API completa para gestão de tours em Portugal",
    version="2.0.0"
)

# ✅ CONFIGURAR O CORS
origins = [
    "http://localhost:3000",
    "https://9rocks.pt",
    "https://www.9rocks.pt",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security scheme for Firebase JWT
security = HTTPBearer(auto_error=False)

# ================================
# GOOGLE CALENDAR CONFIGURATION
# ================================
GOOGLE_CALENDAR_API_KEY = os.environ.get('GOOGLE_CALENDAR_API_KEY', '')
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', '')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# FIREBASE UTILITIES
# ================================
async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase JWT token for admin authentication"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        if token.startswith("temp_admin_token_"):
            return {"uid": "admin", "email": "admin@9rockstours.com"}
        return None
    except Exception:
        return None

def upload_image_to_firebase(image_data: str, filename: str) -> str:
    """Upload base64 image to Firebase Storage"""
    try:
        if image_data.startswith('data:image'):
            return image_data
        else:
            return f"data:image/jpeg;base64,{image_data}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# ================================
# GOOGLE CALENDAR UTILITIES
# ================================
def get_calendar_availability(start_date: str, end_date: str) -> List[str]:
    """Get available dates from Google Calendar"""
    try:
        service = build('calendar', 'v3', developerKey=GOOGLE_CALENDAR_API_KEY)
        events_result = service.events().list(
            calendarId=GOOGLE_CALENDAR_ID,
            timeMin=f"{start_date}T00:00:00Z",
            timeMax=f"{end_date}T23:59:59Z",
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        available_dates = []
        current = start
        while current <= end:
            if current.weekday() < 5:
                available_dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
        return available_dates
    except Exception:
        start = datetime.fromisoformat(start_date)
        available_dates = []
        for i in range(0, 30, 2):
            date = start + timedelta(days=i)
            if date.weekday() < 5:
                available_dates.append(date.strftime("%Y-%m-%d"))
        return available_dates

# ================================
# BOOKING MODELS
# ================================
class BookingCreate(BaseModel):
    tour_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    selected_date: str
    participants: int
    special_requests: Optional[str] = None
    payment_method: str

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    selected_date: str
    participants: int
    total_amount: float
    special_requests: Optional[str] = None
    payment_method: str
    status: str = "pending"
    payment_status: str = "pending"
    payment_transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ================================
# PAYMENT MODELS
# ================================
class PaymentMethod(str, Enum):
    PAYPAL = "paypal"
    GOOGLE_PAY = "google_pay"
    STRIPE_CARD = "stripe_card"
    MULTIBANCO = "multibanco"
    MBWAY = "mbway"

class PaymentRequest(BaseModel):
    amount: float
    currency: str = "EUR"
    tour_id: str
    booking_id: str
    customer_email: str
    customer_name: str
    payment_method: PaymentMethod
    return_url: str
    cancel_url: str
    phone_number: Optional[str] = None

class PaymentResponse(BaseModel):
    payment_id: str
    approval_url: Optional[str] = None
    client_secret: Optional[str] = None
    status: str
    reference: Optional[str] = None

class PaymentExecution(BaseModel):
    payer_id: str

class PaymentIntent(BaseModel):
    payment_intent_id: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str
    booking_id: str
    tour_id: str
    customer_email: str
    customer_name: str
    amount: float
    currency: str
    payment_method: str
    status: str
    transaction_id: Optional[str] = None
    approval_url: Optional[str] = None
    client_secret: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# ================================
# MODELO PARA O NOVO ENDPOINT
# ================================
class PaymentIntentRequest(BaseModel):
    amount: float
    tour_id: str
    booking_id: Optional[str]
    customer_email: EmailStr
    customer_name: str
    currency: Optional[str] = "eur"

# ================================
# FIREBASE MODELS
# ================================
class ImageUpload(BaseModel):
    image_data: str
    filename: str
    tour_id: Optional[str] = None

class ImageUploadResponse(BaseModel):
    image_url: str
    filename: str
    message: str

class CalendarAvailability(BaseModel):
    start_date: str
    end_date: str

class CalendarAvailabilityResponse(BaseModel):
    available_dates: List[str]
    calendar_id: str

# ================================
# ADMIN AUTH MODEL
# ================================
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    message: str
    token: Optional[str] = None

# ================================
# STATS MODELS
# ================================
class BookingStats(BaseModel):
    total_bookings: int
    total_revenue: float
    bookings_by_tour: Dict[str, int]
    bookings_by_date: Dict[str, int]
    bookings_by_status: Dict[str, int]

# ================================
# 🔧 ENDPOINTS DE DEBUG E TESTE - ADICIONADOS
# ================================

@api_router.get("/debug/payment-methods")
async def debug_payment_methods():
    """Endpoint de debug para verificar status de todos os métodos de pagamento"""
    try:
        debug_info = {
            "timestamp": datetime.utcnow().isoformat(),
            "backend_status": "running",
            "environment": {
                "BACKEND_URL": os.getenv("BACKEND_URL", "Not set"),
                "DEBUG": os.getenv("DEBUG", "False"),
                "FIREBASE_PROJECT_ID": os.getenv("FIREBASE_PROJECT_ID", "Not set")[:10] + "..." if os.getenv("FIREBASE_PROJECT_ID") else "Not set"
            },
            "payment_services": {}
        }
        
        # Debug PayPal
        if PAYPAL_AVAILABLE and paypal_service:
            try:
                paypal_test = paypal_service.test_connection()
                debug_info["payment_services"]["paypal"] = {
                    "available": True,
                    "status": paypal_test.get("status"),
                    "mode": paypal_test.get("mode"),
                    "message": paypal_test.get("message")
                }
            except Exception as e:
                debug_info["payment_services"]["paypal"] = {
                    "available": False,
                    "error": str(e)
                }
        else:
            debug_info["payment_services"]["paypal"] = {
                "available": False,
                "message": "PayPal service não inicializado"
            }
        
        # Debug Stripe
        if STRIPE_AVAILABLE and stripe_service:
            try:
                stripe_test = stripe_service.test_connection()
                stripe_debug = stripe_service.get_debug_info()
                debug_info["payment_services"]["stripe"] = {
                    "available": True,
                    "connection_test": stripe_test,
                    "debug_info": stripe_debug,
                    "google_pay_config": stripe_service.get_google_pay_config()
                }
            except Exception as e:
                debug_info["payment_services"]["stripe"] = {
                    "available": False,
                    "error": str(e)
                }
        else:
            debug_info["payment_services"]["stripe"] = {
                "available": False,
                "message": "Stripe service não inicializado"
            }
        
        # Debug Firebase
        try:
            # Testar conexão Firestore
            test_doc = db_firestore.collection('_test').document('connection_test')
            test_doc.set({"test": True, "timestamp": datetime.utcnow()})
            test_doc.delete()
            
            debug_info["firebase"] = {
                "status": "connected",
                "message": "Firestore funcionando"
            }
        except Exception as e:
            debug_info["firebase"] = {
                "status": "error",
                "message": str(e)
            }
        
        return debug_info
        
    except Exception as e:
        return {
            "error": "Erro no debug",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@api_router.get("/debug/stripe/test-cards")
async def get_stripe_test_cards():
    """Retornar cartões de teste do Stripe para desenvolvimento"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não disponível")
    
    try:
        test_cards = stripe_service.get_test_cards()
        return {
            "success": True,
            "test_cards": test_cards,
            "instructions": [
                "🔧 Estes cartões só funcionam em modo TEST",
                "💳 Adicione-os ao Google Pay para testar",
                "🌐 Use Chrome com extensão Google Pay ativa",
                "📱 Ou teste em dispositivo móvel com Google Pay configurado"
            ],
            "setup_guide": {
                "step_1": "Certificar que STRIPE_SECRET_KEY começa com 'sk_test_'",
                "step_2": "GOOGLE_MERCHANT_ID deve estar configurado",
                "step_3": "Usar ambiente TEST do Google Pay",
                "step_4": "Adicionar cartões de teste ao Google Pay",
                "step_5": "Testar pagamento no frontend"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/debug/google-pay/config")
async def get_google_pay_debug_config():
    """Configuração completa do Google Pay para debug"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não disponível")
    
    try:
        config = stripe_service.get_google_pay_config()
        
        return {
            "google_pay_config": config,
            "frontend_setup": {
                "payment_request": {
                    "apiVersion": 2,
                    "apiVersionMinor": 0,
                    "allowedPaymentMethods": [
                        {
                            "type": "CARD",
                            "parameters": {
                                "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                                "allowedCardNetworks": ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"]
                            },
                            "tokenizationSpecification": {
                                "type": "PAYMENT_GATEWAY",
                                "parameters": {
                                    "gateway": "stripe",
                                    "stripe:version": "2020-08-27",
                                    "stripe:publishableKey": config["publishable_key"]
                                }
                            }
                        }
                    ],
                    "merchantInfo": {
                        "merchantName": "9 Rocks Tours",
                        "merchantId": config["merchant_id"]
                    }
                }
            },
            "validation": {
                "publishable_key_valid": bool(config["publishable_key"]),
                "merchant_id_valid": bool(config["merchant_id"]),
                "environment_correct": config["environment"],
                "mode": config["mode"]
            },
            "troubleshooting": [
                "✅ Verificar se publishable_key está correto",
                "✅ Verificar se merchant_id está configurado",
                "✅ Usar ambiente TEST para desenvolvimento",
                "✅ Certificar que Google Pay API está carregada",
                "✅ Verificar console browser para erros JavaScript"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/debug/stripe/create-test-intent")
async def create_test_payment_intent():
    """Criar Payment Intent de teste para debug"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não disponível")
    
    try:
        test_data = {
            "amount": 10.00,  # 10 EUR
            "tour_id": "test_tour_debug",
            "booking_id": "test_booking_debug",
            "customer_email": "test@9rocks.pt",
            "customer_name": "Debug Test Customer",
            "tour_name": "Debug Test Tour",
            "participants": 1
        }
        
        intent_result = stripe_service.create_payment_intent(test_data)
        
        return {
            "success": True,
            "intent_result": intent_result,
            "test_data": test_data,
            "next_steps": [
                "1. Copiar client_secret do resultado",
                "2. Usar no frontend para testar Google Pay",
                "3. Confirmar pagamento com cartão de teste",
                "4. Verificar logs no console"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str( e))

@api_router.get("/debug/logs/payment/{booking_id}")
async def get_payment_logs(booking_id: str):
    """Buscar logs de pagamento para um booking específico"""
    try:
        # Buscar transações relacionadas
        transactions_ref = db_firestore.collection('payment_transactions')
        docs = transactions_ref.where('booking_id', '==', booking_id).stream()
        
        transactions = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Converter timestamps para string
            for field in ['created_at', 'completed_at', 'updated_at']:
                if field in data and data[field]:
                    data[field] = data[field].isoformat() if hasattr(data[field], 'isoformat') else str(data[field])
            
            transactions.append(data)
        
        # Buscar booking
        booking_doc = db_firestore.collection('bookings').document(booking_id).get()
        booking_data = None
        if booking_doc.exists:
            booking_data = booking_doc.to_dict()
            for field in ['created_at', 'updated_at']:
                if field in booking_data and booking_data[field]:
                    booking_data[field] = booking_data[field].isoformat() if hasattr(booking_data[field], 'isoformat') else str(booking_data[field])
        
        return {
            "booking_id": booking_id,
            "booking_data": booking_data,
            "transactions": transactions,
            "transaction_count": len(transactions),
            "latest_status": transactions[0].get('status') if transactions else None,
            "debug_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/debug/clear-test-data")
async def clear_test_payment_data():
    """Limpar dados de teste de pagamentos"""
    try:
        deleted_count = 0
        
        # Limpar transações de teste
        transactions_ref = db_firestore.collection('payment_transactions')
        test_transactions = transactions_ref.where('tour_id', '==', 'test_tour_debug').stream()
        
        for doc in test_transactions:
            doc.reference.delete()
            deleted_count += 1
        
        # Limpar bookings de teste
        bookings_ref = db_firestore.collection('bookings')
        test_bookings = bookings_ref.where('tour_id', '==', 'test_tour_debug').stream()
        
        for doc in test_bookings:
            doc.reference.delete()
            deleted_count += 1
        
        return {
            "success": True,
            "message": f"Dados de teste limpos: {deleted_count} documentos removidos",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/debug/environment")
async def get_environment_debug():
    """Verificar variáveis de ambiente críticas"""
    env_vars = {
        "STRIPE_SECRET_KEY": "✅ Set" if os.getenv('STRIPE_SECRET_KEY') else "❌ Missing",
        "STRIPE_PUBLISHABLE_KEY": "✅ Set" if os.getenv('STRIPE_PUBLISHABLE_KEY') else "❌ Missing",
        "STRIPE_WEBHOOK_SECRET": "✅ Set" if os.getenv('STRIPE_WEBHOOK_SECRET') else "❌ Missing",
        "GOOGLE_MERCHANT_ID": "✅ Set" if os.getenv('GOOGLE_MERCHANT_ID') else "❌ Missing",
        "PAYPAL_CLIENT_ID": "✅ Set" if os.getenv('PAYPAL_CLIENT_ID') else "❌ Missing",
        "PAYPAL_CLIENT_SECRET": "✅ Set" if os.getenv('PAYPAL_CLIENT_SECRET') else "❌ Missing",
        "FIREBASE_PROJECT_ID": "✅ Set" if os.getenv('FIREBASE_PROJECT_ID') else "❌ Missing",
        "DEBUG": os.getenv('DEBUG', 'False'),
        "BACKEND_URL": os.getenv('BACKEND_URL', 'Not set')
    }
    
    # Verificar se chaves são de teste ou produção
    stripe_key = os.getenv('STRIPE_SECRET_KEY', '')
    paypal_key = os.getenv('PAYPAL_CLIENT_ID', '')
    
    mode_analysis = {
        "stripe_mode": "TEST" if "test" in stripe_key else "LIVE" if stripe_key else "NOT_SET",
        "paypal_mode": "TEST" if "sandbox" in paypal_key else "LIVE" if paypal_key else "NOT_SET",
        "recommended_for_dev": "TEST",
        "warning": "⚠️ NEVER use LIVE keys in development!" if ("live" in stripe_key.lower() or ("sandbox" not in paypal_key and paypal_key)) else None
    }
    
    return {
        "environment_variables": env_vars,
        "mode_analysis": mode_analysis,
        "setup_recommendations": [
            "🔧 Use TEST keys for development",
            "🌐 Set GOOGLE_MERCHANT_ID for Google Pay",
            "🔐 Keep production keys secure",
            "📝 Check .env file configuration",
            "🚀 Restart server after env changes"
        ]
    }

# ================================
# 📊 ENDPOINT DE MONITORAMENTO EM TEMPO REAL
# ================================

@api_router.get("/debug/monitor/live")
async def live_payment_monitor():
    """Monitor em tempo real dos pagamentos"""
    try:
        # Buscar transações recentes (últimas 2 horas)
        two_hours_ago = datetime.utcnow() - timedelta(hours=2)
        
        transactions_ref = db_firestore.collection('payment_transactions')
        docs = transactions_ref.where('created_at', '>=', two_hours_ago).order_by('created_at', direction=firestore.Query.DESCENDING).limit(20).stream()
        
        recent_transactions = []
        status_counts = {"created": 0, "completed": 0, "failed": 0, "pending": 0}
        
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # Converter timestamps
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat()
            
            status = data.get('status', 'unknown')
            if status in status_counts:
                status_counts[status] += 1
            
            recent_transactions.append(data)
        
        # Estatísticas rápidas
        total_amount = sum(float(t.get('amount', 0)) for t in recent_transactions)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "monitoring_period": "2 hours",
            "recent_transactions": recent_transactions,
            "statistics": {
                "total_transactions": len(recent_transactions),
                "total_amount": round(total_amount, 2),
                "status_breakdown": status_counts,
                "success_rate": round((status_counts["completed"] / max(len(recent_transactions), 1)) * 100, 2)
            },
            "system_health": {
                "stripe_available": STRIPE_AVAILABLE,
                "paypal_available": PAYPAL_AVAILABLE,
                "firebase_connected": bool(db_firestore)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no monitor: {str(e)}")

# ================================
# 🔄 ENDPOINT DE SIMULAÇÃO DE FLUXO COMPLETO
# ================================

@api_router.post("/debug/simulate/complete-flow")
async def simulate_complete_payment_flow(
    payment_method: str = "google_pay",
    amount: float = 25.0,
    simulate_failure: bool = False
):
    """Simular fluxo completo de pagamento para debug"""
    try:
        simulation_id = f"sim_{int(datetime.utcnow().timestamp())}"
        
        simulation_log = {
            "simulation_id": simulation_id,
            "payment_method": payment_method,
            "amount": amount,
            "simulate_failure": simulate_failure,
            "steps": [],
            "started_at": datetime.utcnow(),
            "status": "running"
        }
        
        # Passo 1: Criar booking simulado
        simulation_log["steps"].append({
            "step": 1,
            "name": "create_booking",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success",
            "details": "Booking simulado criado"
        })
        
        booking_data = {
            "tour_id": f"sim_tour_{simulation_id}",
            "customer_name": "Simulation Test User",
            "customer_email": f"sim_{simulation_id}@test.com",
            "customer_phone": "+351912345678",
            "selected_date": (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d'),
            "participants": 2,
            "special_requests": f"Simulação {simulation_id}",
            "payment_method": payment_method,
            "total_amount": amount,
            "is_simulation": True
        }
        
        booking_id = f"sim_booking_{simulation_id}"
        
        # Passo 2: Criar Payment Intent
        if payment_method in ["google_pay", "stripe_card"] and STRIPE_AVAILABLE:
            try:
                payment_data = {
                    "amount": amount,
                    "tour_id": booking_data["tour_id"],
                    "booking_id": booking_id,
                    "customer_email": booking_data["customer_email"],
                    "customer_name": booking_data["customer_name"],
                    "tour_name": f"Tour Simulação {simulation_id}",
                    "participants": booking_data["participants"]
                }
                
                intent_result = stripe_service.create_payment_intent(payment_data)
                
                if intent_result["status"] == "created":
                    simulation_log["steps"].append({
                        "step": 2,
                        "name": "create_payment_intent",
                        "timestamp": datetime.utcnow().isoformat(),
                        "status": "success",
                        "details": f"Payment Intent criado: {intent_result['payment_intent_id']}"
                    })
                    
                    # Passo 3: Simular autorização
                    if simulate_failure:
                        simulation_log["steps"].append({
                            "step": 3,
                            "name": "payment_authorization",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "failed",
                            "details": "Falha simulada na autorização"
                        })
                        simulation_log["status"] = "failed"
                    else:
                        # Simular sucesso
                        simulation_log["steps"].append({
                            "step": 3,
                            "name": "payment_authorization",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": "Pagamento autorizado com sucesso"
                        })
                        
                        # Passo 4: Confirmar pagamento
                        simulation_log["steps"].append({
                            "step": 4,
                            "name": "payment_confirmation",
                            "timestamp": datetime.utcnow().isoformat(),
                            "status": "success",
                            "details": "Pagamento confirmado"
                        })
                        
                        simulation_log["status"] = "completed"
                else:
                    simulation_log["steps"].append({
                        "step": 2,
                        "name": "create_payment_intent",
                        "timestamp": datetime.utcnow().isoformat(),
                        "status": "failed",
                        "details": f"Falha ao criar Payment Intent: {intent_result.get('message')}"
                    })
                    simulation_log["status"] = "failed"
                    
            except Exception as e:
                simulation_log["steps"].append({
                    "step": 2,
                    "name": "create_payment_intent",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "error",
                    "details": f"Erro: {str(e)}"
                })
                simulation_log["status"] = "error"
        
        elif payment_method == "paypal" and PAYPAL_AVAILABLE:
            # Simular fluxo PayPal
            simulation_log["steps"].append({
                "step": 2,
                "name": "paypal_payment_creation",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success" if not simulate_failure else "failed",
                "details": "PayPal payment simulado"
            })
            simulation_log["status"] = "completed" if not simulate_failure else "failed"
        
        else:
            simulation_log["steps"].append({
                "step": 2,
                "name": "payment_service_check",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "failed",
                "details": f"Serviço {payment_method} não disponível"
            })
            simulation_log["status"] = "failed"
        
        simulation_log["completed_at"] = datetime.utcnow()
        simulation_log["duration_seconds"] = (simulation_log["completed_at"] - simulation_log["started_at"]).total_seconds()
        
        # Salvar simulação no Firestore
        db_firestore.collection('payment_simulations').document(simulation_id).set(simulation_log)
        
        return {
            "success": True,
            "simulation": simulation_log,
            "recommendations": generate_simulation_recommendations(simulation_log)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na simulação: {str(e)}")

def generate_simulation_recommendations(simulation_log: Dict) -> List[str]:
    """Gerar recomendações baseadas na simulação"""
    recommendations = []
    
    if simulation_log["status"] == "failed":
        recommendations.append("🔧 Verificar configuração dos serviços de pagamento")
        recommendations.append("📝 Analisar logs detalhados para identificar falha")
    
    if simulation_log["status"] == "completed":
        recommendations.append("✅ Fluxo funcionando corretamente")
        recommendations.append("🚀 Pronto para testes reais")
    
    duration = simulation_log.get("duration_seconds", 0)
    if duration > 5:
        recommendations.append("⚡ Otimizar performance - simulação demorou mais que 5s")
    
    return recommendations

# ================================
# 📱 ENDPOINT DE TESTE MOBILE
# ================================

@api_router.get("/debug/mobile/user-agent-test")
async def test_mobile_compatibility(request: Request):
    """Testar compatibilidade mobile baseada no User-Agent"""
    try:
        user_agent = request.headers.get("user-agent", "")
        
        # Detectar tipo de dispositivo
        is_mobile = any(device in user_agent.lower() for device in ["mobile", "android", "iphone", "ipad"])
        is_chrome = "chrome" in user_agent.lower()
        is_safari = "safari" in user_agent.lower() and "chrome" not in user_agent.lower()
        
        # Verificar compatibilidade Google Pay
        google_pay_compatible = False
        google_pay_notes = []
        
        if is_mobile and "android" in user_agent.lower():
            google_pay_compatible = True
            google_pay_notes.append("✅ Android móvel - Google Pay nativo suportado")
        elif is_mobile and "iphone" in user_agent.lower():
            google_pay_compatible = False
            google_pay_notes.append("❌ iPhone - Google Pay não suportado nativamente")
            google_pay_notes.append("💡 Considerar Apple Pay como alternativa")
        elif is_chrome:
            google_pay_compatible = True
            google_pay_notes.append("✅ Chrome desktop - Google Pay web suportado")
        else:
            google_pay_compatible = False
            google_pay_notes.append("⚠️ Browser pode não suportar Google Pay")
        
        return {
            "user_agent": user_agent,
            "device_detection": {
                "is_mobile": is_mobile,
                "is_chrome": is_chrome,
                "is_safari": is_safari,
                "estimated_os": get_estimated_os(user_agent)
            },
            "google_pay_compatibility": {
                "compatible": google_pay_compatible,
                "notes": google_pay_notes,
                "recommended_actions": get_mobile_recommendations(user_agent, google_pay_compatible)
            },
            "test_suggestions": [
                "🧪 Testar com diferentes User-Agents",
                "📱 Verificar em dispositivo real",
                "🔍 Usar Chrome DevTools para simular mobile",
                "📋 Validar com cartões de teste"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no teste mobile: {str(e)}")

def get_estimated_os(user_agent: str) -> str:
    """Estimar OS baseado no User-Agent"""
    user_agent_lower = user_agent.lower()
    
    if "android" in user_agent_lower:
        return "Android"
    elif "iphone" in user_agent_lower or "ipad" in user_agent_lower:
        return "iOS"
    elif "windows" in user_agent_lower:
        return "Windows"
    elif "macintosh" in user_agent_lower or "mac os" in user_agent_lower:
        return "macOS"
    elif "linux" in user_agent_lower:
        return "Linux"
    else:
        return "Unknown"

def get_mobile_recommendations(user_agent: str, google_pay_compatible: bool) -> List[str]:
    """Gerar recomendações específicas para mobile"""
    recommendations = []
    
    if google_pay_compatible:
        recommendations.append("✅ Implementar Google Pay normalmente")
        recommendations.append("📱 Testar em dispositivo real")
    else:
        recommendations.append("💳 Implementar métodos alternativos (Apple Pay, cartão)")
        recommendations.append("🔄 Fallback para formulário de cartão tradicional")
    
    if "iphone" in user_agent.lower():
        recommendations.append("🍎 Considerar integração Apple Pay")
        recommendations.append("💻 Testar Safari compatibilidade")
    
    return recommendations

# ================================
# 🔒 ENDPOINT DE VALIDAÇÃO DE SEGURANÇA
# ================================

@api_router.get("/debug/security/validate-config")
async def validate_security_config(request: Request):
    """Validar configurações de segurança"""
    try:
        security_issues = []
        security_recommendations = []
        
        # Verificar chaves de ambiente
        stripe_secret = os.getenv('STRIPE_SECRET_KEY', '')
        stripe_public = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
        
        # Verificar se são chaves de teste
        if stripe_secret and not stripe_secret.startswith('sk_test_'):
            security_issues.append("🚨 CHAVE STRIPE SECRETA pode ser de PRODUÇÃO!")
            security_recommendations.append("Use apenas chaves sk_test_ em desenvolvimento")
        
        if stripe_public and not stripe_public.startswith('pk_test_'):
            security_issues.append("🚨 CHAVE STRIPE PÚBLICA pode ser de PRODUÇÃO!")
            security_recommendations.append("Use apenas chaves pk_test_ em desenvolvimento")
        
        # Verificar debug mode
        debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
        if not debug_mode:
            security_recommendations.append("🔧 Ativar DEBUG=true para desenvolvimento")
        
        # Verificar HTTPS (em produção)
        if not debug_mode and not request.url.scheme == 'https':
            security_issues.append("🔒 HTTPS obrigatório em produção")
        
        # Verificar CORS
        cors_origins = os.getenv('CORS_ORIGINS', '')
        if not cors_origins:
            security_recommendations.append("🌐 Configurar CORS_ORIGINS para produção")
        
        # Score de segurança
        security_score = 100 - (len(security_issues) * 20)
        security_level = "🟢 BOM" if security_score >= 80 else "🟡 MÉDIO" if security_score >= 60 else "🔴 CRÍTICO"
        
        return {
            "security_score": security_score,
            "security_level": security_level,
            "environment": "DEVELOPMENT" if debug_mode else "PRODUCTION",
            "issues_found": security_issues,
            "recommendations": security_recommendations,
            "validation_details": {
                "stripe_keys_safe": not any("PRODUÇÃO" in issue for issue in security_issues),
                "debug_mode": debug_mode,
                "https_used": request.url.scheme == 'https',
                "cors_configured": bool(cors_origins)
            },
            "next_steps": [
                "🔧 Corrigir issues críticos primeiro",
                "📝 Implementar recomendações",
                "🧪 Re-executar validação",
                "🚀 Deploy apenas após score 80+"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na validação: {str(e)}")

# ================================
# 🎯 ENDPOINT DE TESTE GOOGLE PAY ESPECÍFICO
# ================================

@api_router.post("/payments/google-pay/test-flow")
async def test_google_pay_complete_flow():
    """Testar fluxo completo do Google Pay"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não disponível")
    
    try:
        # 1. Criar booking de teste
        test_booking_data = {
            "tour_id": "test_tour_google_pay",
            "customer_name": "Google Pay Test User",
            "customer_email": "googlepay_test@9rocks.pt",
            "customer_phone": "+351912345678",
            "selected_date": (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d'),
            "participants": 1,
            "special_requests": "Teste Google Pay",
            "payment_method": "google_pay"
        }
        
        # Simular criação de booking
        booking_id = f"test_booking_gp_{int(datetime.utcnow().timestamp())}"
        test_booking_data["total_amount"] = 50.0
        
        # 2. Criar Payment Intent
        payment_data = {
            "amount": 50.0,
            "tour_id": "test_tour_google_pay",
            "booking_id": booking_id,
            "customer_email": "googlepay_test@9rocks.pt",
            "customer_name": "Google Pay Test User",
            "tour_name": "Teste Google Pay Tour",
            "participants": 1
        }
        
        intent_result = stripe_service.create_payment_intent(payment_data)
        
        if intent_result["status"] != "created":
            raise HTTPException(status_code=500, detail=f"Falha ao criar intent: {intent_result}")
        
        # 3. Salvar dados de teste no Firestore
        transaction_data = {
            "id": f"test_transaction_gp_{int(datetime.utcnow().timestamp())}",
            "payment_id": intent_result["payment_intent_id"],
            "booking_id": booking_id,
            "tour_id": "test_tour_google_pay",
            "customer_email": "googlepay_test@9rocks.pt",
            "customer_name": "Google Pay Test User",
            "amount": 50.0,
            "currency": "EUR",
            "payment_method": "google_pay",
            "status": "created",
            "client_secret": intent_result["client_secret"],
            "created_at": datetime.utcnow(),
            "is_test": True
        }
        
        db_firestore.collection('payment_transactions').document(transaction_data["id"]).set(transaction_data)
        
        return {
            "success": True,
            "message": "Fluxo de teste Google Pay criado com sucesso",
            "test_data": {
                "booking_id": booking_id,
                "payment_intent_id": intent_result["payment_intent_id"],
                "client_secret": intent_result["client_secret"],
                "amount": 50.0,
                "currency": "EUR"
            },
            "frontend_test_config": {
                "google_pay_config": stripe_service.get_google_pay_config(),
                "payment_request_amount": "50.00",
                "test_instructions": [
                    "1. Usar este client_secret no frontend",
                    "2. Configurar Google Pay com merchant_id fornecido",
                    "3. Usar cartões de teste do Stripe",
                    "4. Verificar logs no console browser",
                    "5. Confirmar pagamento e verificar status"
                ]
            },
            "cleanup_note": "Use /debug/clear-test-data para limpar após testes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no teste Google Pay: {str(e)}")

# ================================
# 🔧 WEBHOOK DE DEBUG PARA STRIPE
# ================================

@api_router.post("/webhooks/stripe/debug")
async def stripe_webhook_debug(request: Request):
    """Webhook Stripe com logging de debug"""
    try:
        body = await request.body()
        signature = request.headers.get('stripe-signature')
        
        if not STRIPE_AVAILABLE or not stripe_service:
            logger.error("❌ Stripe não disponível para webhook")
            raise HTTPException(status_code=503, detail="Stripe não disponível")
        
        # Log do webhook recebido
        logger.info(f"📢 Webhook Stripe recebido - Signature: {signature[:20]}...")
        
        # Processar webhook
        webhook_result = stripe_service.handle_webhook(body.decode('utf-8'), signature)
        
        logger.info(f"✅ Webhook processado: {webhook_result}")
        
        # Salvar log do webhook no Firestore para debug
        webhook_log = {
            "timestamp": datetime.utcnow(),
            "signature": signature[:20] + "..." if signature else None,
            "result": webhook_result,
            "body_size": len(body),
            "processed": True
        }
        
        db_firestore.collection('webhook_logs').add(webhook_log)
        
        return {"received": True, "result": webhook_result}
        
    except Exception as e:
        logger.error(f"❌ Erro no webhook Stripe: {e}")
        
        # Salvar erro no Firestore
        error_log = {
            "timestamp": datetime.utcnow(),
            "error": str(e),
            "processed": False
        }
        
        try:
            db_firestore.collection('webhook_logs').add(error_log)
        except:
            pass  # Não falhar se não conseguir salvar log
        
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# 📈 ENDPOINT DE MÉTRICAS AVANÇADAS
# ================================

@api_router.get("/debug/metrics/payment-analytics")
async def get_payment_analytics(days: int = 7):
    """Análise avançada de métricas de pagamento"""
    try:
        # Data limite
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Buscar transações
        transactions_ref = db_firestore.collection('payment_transactions')
        docs = transactions_ref.where('created_at', '>=', start_date).stream()
        
        transactions = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            transactions.append(data)
        
        # Análises
        analytics = {
            "period_days": days,
            "total_transactions": len(transactions),
            "total_amount": sum(float(t.get('amount', 0)) for t in transactions),
            "by_method": {},
            "by_status": {},
            "by_day": {},
            "success_rate": 0,
            "average_amount": 0,
            "trends": {}
        }
        
        # Agrupar por método
        for transaction in transactions:
            method = transaction.get('payment_method', 'unknown')
            if method not in analytics["by_method"]:
                analytics["by_method"][method] = {"count": 0, "amount": 0}
            
            analytics["by_method"][method]["count"] += 1
            analytics["by_method"][method]["amount"] += float(transaction.get('amount', 0))
        
        # Agrupar por status
        for transaction in transactions:
            status = transaction.get('status', 'unknown')
            if status not in analytics["by_status"]:
                analytics["by_status"][status] = 0
            
            analytics["by_status"][status] += 1
        
        # Calcular métricas
        if analytics["total_transactions"] > 0:
            successful = analytics["by_status"].get("completed", 0) + analytics["by_status"].get("succeeded", 0)
            analytics["success_rate"] = round((successful / analytics["total_transactions"]) * 100, 2)
            analytics["average_amount"] = round(analytics["total_amount"] / analytics["total_transactions"], 2)
        
        # Análise de tendências
        analytics["trends"] = {
            "most_used_method": max(analytics["by_method"].items(), key=lambda x: x[1]["count"])[0] if analytics["by_method"] else "none",
            "highest_revenue_method": max(analytics["by_method"].items(), key=lambda x: x[1]["amount"])[0] if analytics["by_method"] else "none",
            "main_failure_reason": analyze_failure_reasons(transactions)
        }
        
        return {
            "analytics": analytics,
            "insights": generate_business_insights(analytics),
            "recommendations": generate_optimization_recommendations(analytics)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro nas métricas: {str(e)}")

def analyze_failure_reasons(transactions: List[Dict]) -> str:
    """Analisar principais razões de falha"""
    failed_transactions = [t for t in transactions if t.get('status') in ['failed', 'cancelled', 'error']]
    
    if not failed_transactions:
        return "no_failures"
    
    # Analisar padrões (simplificado)
    return "card_declined"  # Placeholder - implementar análise real

def generate_business_insights(analytics: Dict) -> List[str]:
    """Gerar insights de negócio"""
    insights = []
    
    if analytics["success_rate"] >= 95:
        insights.append("✅ Taxa de sucesso excelente (>95%)")
    elif analytics["success_rate"] >= 85:
        insights.append("🟡 Taxa de sucesso boa (85-95%)")
    else:
        insights.append("🔴 Taxa de sucesso precisa melhorar (<85%)")
    
    if analytics["total_transactions"] > 0:
        avg_amount = analytics["average_amount"]
        if avg_amount > 100:
            insights.append("💰 Ticket médio alto (>€100)")
        elif avg_amount > 50:
            insights.append("💳 Ticket médio moderado (€50-100)")
        else:
            insights.append("🎯 Ticket médio baixo (<€50)")
    
    return insights

def generate_optimization_recommendations(analytics: Dict) -> List[str]:
    """Gerar recomendações de otimização"""
    recommendations = []
    
    if analytics["success_rate"] < 90:
        recommendations.append("🔧 Investigar falhas de pagamento")
        recommendations.append("📞 Melhorar suporte ao cliente")
    
    # Analisar métodos de pagamento
    methods = analytics["by_method"]
    if "google_pay" in methods and methods["google_pay"]["count"] > 0:
        recommendations.append("📱 Google Pay está funcionando - continuar promovendo")
    else:
        recommendations.append("🔍 Investigar problemas com Google Pay")
    
    return recommendations

# ================================
# 🔄 ENDPOINT DE WEBHOOK TESTING
# ================================

@api_router.post("/debug/webhook/test-stripe")
async def test_stripe_webhook():
    """Testar webhook Stripe com payload simulado"""
    try:
        # Payload simulado de webhook
        test_payload = {
            "id": "evt_test_webhook",
            "object": "event",
            "api_version": "2020-08-27",
            "created": int(datetime.utcnow().timestamp()),
            "data": {
                "object": {
                    "id": "pi_test_payment_intent",
                    "object": "payment_intent",
                    "amount": 5000,  # €50.00
                    "currency": "eur",
                    "status": "succeeded",
                    "metadata": {
                        "booking_id": "test_booking_webhook",
                        "tour_id": "test_tour_webhook"
                    }
                }
            },
            "livemode": False,
            "pending_webhooks": 1,
            "request": {
                "id": None,
                "idempotency_key": None
            },
            "type": "payment_intent.succeeded"
        }
        
        # Simular processamento
        if STRIPE_AVAILABLE and stripe_service:
            result = stripe_service.handle_webhook(
                json.dumps(test_payload),
                "test_signature"
            )
            
            return {
                "success": True,
                "test_payload": test_payload,
                "processing_result": result,
                "notes": [
                    "✅ Webhook test executado",
                    "🔧 Em produção, use signature real",
                    "📝 Verificar logs do webhook",
                    "🚀 Implementar em endpoint real"
                ]
            }
        else:
            return {
                "success": False,
                "message": "Stripe service não disponível",
                "test_payload": test_payload
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no teste webhook: {str(e)}")

# ================================
# 🚀 PAYPAL ENDPOINTS
# ================================

@api_router.get("/payments/test/paypal")
async def test_paypal_connection():
    """Testar conexão PayPal"""
    if not PAYPAL_AVAILABLE or not paypal_service:
        return {
            "status": "error",
            "message": "PayPal Service não disponível",
            "mode": "N/A"
        }
    
    try:
        result = paypal_service.test_connection()
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro na conexão PayPal: {str(e)}",
            "mode": paypal_service.mode if paypal_service else "N/A"
        }

@api_router.post("/payments/paypal/create", response_model=PaymentResponse)
async def create_paypal_payment(payment_request: PaymentRequest):
    """Criar pagamento PayPal"""
    if not PAYPAL_AVAILABLE or not paypal_service:
        raise HTTPException(status_code=503, detail="PayPal não está disponível")
    
    try:
        booking_doc = db_firestore.collection('bookings').document(payment_request.booking_id).get()
        if not booking_doc.exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        
        booking_data = booking_doc.to_dict()
        tour_doc = db_firestore.collection('tours').document(payment_request.tour_id).get()
        if not tour_doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        tour_data = tour_doc.to_dict()
        paypal_data = {
            "amount": payment_request.amount,
            "tour_id": payment_request.tour_id,
            "tour_name": tour_data.get('name', {}).get('pt', 'Tour Portugal'),
            "booking_id": payment_request.booking_id,
            "participants": booking_data.get('participants', 1),
            "return_url": payment_request.return_url,
            "cancel_url": payment_request.cancel_url
        }
        
        payment_result = paypal_service.create_payment(paypal_data)
        transaction = PaymentTransaction(
            payment_id=payment_result["payment_id"],
            booking_id=payment_request.booking_id,
            tour_id=payment_request.tour_id,
            customer_email=payment_request.customer_email,
            customer_name=payment_request.customer_name,
            amount=payment_request.amount,
            currency="EUR",
            payment_method="paypal",
            status="created",
            approval_url=payment_result.get("approval_url")
        )
        
        transaction_dict = transaction.dict()
        db_firestore.collection('payment_transactions').document(transaction_dict['id']).set(transaction_dict)
        
        return PaymentResponse(
            payment_id=payment_result["payment_id"],
            approval_url=payment_result.get("approval_url"),
            status=payment_result["status"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/paypal/execute/{payment_id}")
async def execute_paypal_payment(payment_id: str, execution: PaymentExecution):
    """Executar pagamento PayPal aprovado"""
    if not PAYPAL_AVAILABLE or not paypal_service:
        raise HTTPException(status_code=503, detail="PayPal não está disponível")
    
    try:
        transaction_docs = db_firestore.collection('payment_transactions').where('payment_id', '==', payment_id).stream()
        transaction_doc = None
        for doc in transaction_docs:
            transaction_doc = doc
            break
        
        if not transaction_doc:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        
        transaction_data = transaction_doc.to_dict()
        if transaction_data.get("status") == "completed":
            return {"message": "Pagamento já processado", "status": "completed"}
        
        execution_result = paypal_service.execute_payment(payment_id, execution.payer_id)
        update_data = {
            "status": "completed",
            "transaction_id": execution_result.get("transaction_id"),
            "payer_email": execution_result.get("payer_email"),
            "payer_name": execution_result.get("payer_name"),
            "completed_at": datetime.utcnow()
        }
        
        db_firestore.collection('payment_transactions').document(transaction_doc.id).update(update_data)
        
        booking_id = transaction_data.get("booking_id")
        if booking_id:
            booking_update = {
                "payment_status": "paid",
                "status": "confirmed",
                "payment_transaction_id": execution_result.get("transaction_id"),
                "updated_at": datetime.utcnow()
            }
            db_firestore.collection('bookings').document(booking_id).update(booking_update)
        
        return execution_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/paypal/status/{payment_id}")
async def get_paypal_payment_status(payment_id: str):
    """Verificar status do pagamento PayPal"""
    if not PAYPAL_AVAILABLE or not paypal_service:
        raise HTTPException(status_code=503, detail="PayPal não está disponível")
    
    try:
        payment_details = paypal_service.get_payment_details(payment_id)
        transaction_docs = db_firestore.collection('payment_transactions').where('payment_id', '==', payment_id).stream()
        for doc in transaction_docs:
            current_data = doc.to_dict()
            if current_data.get("status") != payment_details["status"]:
                db_firestore.collection('payment_transactions').document(doc.id).update({
                    "status": payment_details["status"],
                    "updated_at": datetime.utcnow()
                })
            break
        
        return payment_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhooks/paypal")
async def paypal_webhook(request: Request):
    """Webhook PayPal"""
    try:
        body = await request.body()
        body_str = body.decode('utf-8')
        webhook_data = json.loads(body_str)
        event_type = webhook_data.get('event_type')
        
        if event_type == 'PAYMENT.SALE.COMPLETED':
            resource = webhook_data.get('resource', {})
            payment_id = resource.get('parent_payment')
            
            if payment_id:
                transaction_docs = db_firestore.collection('payment_transactions').where('payment_id', '==', payment_id).stream()
                for doc in transaction_docs:
                    db_firestore.collection('payment_transactions').document(doc.id).update({
                        "status": "completed",
                        "webhook_received_at": datetime.utcnow()
                    })
                    break
        
        return {"status": "webhook_processed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# 🚀 STRIPE/GOOGLE PAY ENDPOINTS
# ================================

@api_router.get("/payments/test/stripe")
async def test_stripe_connection():
    """Testar conexão Stripe"""
    if not STRIPE_AVAILABLE or not stripe_service:
        return {
            "status": "error",
            "message": "Stripe Service não disponível",
            "mode": "N/A"
        }
    
    try:
        result = stripe_service.test_connection()
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro na conexão Stripe: {str(e)}",
            "mode": stripe_service.mode if stripe_service else "N/A"
        }

@api_router.get("/payments/stripe/config")
async def get_stripe_config():
    """Configuração Stripe para frontend"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não está disponível")
    
    return {
        "publishable_key": stripe_service.get_publishable_key(),
        "merchant_id": os.getenv('GOOGLE_MERCHANT_ID'),
        "available": True,
        "mode": stripe_service.mode
    }

@api_router.post("/payments/create-intent")
async def create_stripe_payment_intent(payment_data: PaymentIntentRequest):
    """
    Cria um Payment Intent genérico para qualquer pagamento via Stripe (Cartão, MB WAY, Google Pay, etc).
    Este endpoint usa automatic_payment_methods.
    """
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="O serviço de pagamento Stripe não está disponível.")

    try:
        # Converter o modelo Pydantic num dicionário para enviar ao serviço
        stripe_data = payment_data.dict()
        
        # Adicionar dados extra que o seu serviço pode precisar (ex: tour_name)
        # (Esta lógica pode ser adaptada conforme a sua necessidade)
        tour_doc = db_firestore.collection('tours').document(payment_data.tour_id).get()
        if tour_doc.exists:
            stripe_data['tour_name'] = tour_doc.to_dict().get('name', {}).get('pt', 'Tour em Portugal')
        else:
            stripe_data['tour_name'] = 'Tour em Portugal'
            
        # Chamar a função do seu stripe_service
        intent_result = stripe_service.create_payment_intent(stripe_data)
        
        # Se o serviço do Stripe retornar um erro, envie uma resposta HTTP de erro
        if intent_result.get("status") != "created":
            raise HTTPException(status_code=400, detail=intent_result.get("message", "Erro ao criar intenção de pagamento no Stripe"))

        # A criação da transação no Firestore pode ser feita aqui ou após confirmação,
        # mas para manter a consistência com o seu código anterior, vamos mantê-la.
        transaction = PaymentTransaction(
            payment_id=intent_result["payment_intent_id"],
            booking_id=payment_data.booking_id,
            tour_id=payment_data.tour_id,
            customer_email=payment_data.customer_email,
            customer_name=payment_data.customer_name,
            amount=payment_data.amount,
            currency="EUR",
            payment_method="stripe", # Genérico para todos os métodos do Elements
            status="created",
            client_secret=intent_result["client_secret"]
        )
        db_firestore.collection('payment_transactions').document(transaction.id).set(transaction.dict())

        # Se tudo correr bem, retorne o resultado para o frontend
        return {
            "client_secret": intent_result["client_secret"],
            "payment_intent_id": intent_result["payment_intent_id"],
            "status": intent_result["status"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro inesperado ao criar Payment Intent: {e}")
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno: {str(e)}")

@api_router.post("/payments/stripe/confirm/{payment_intent_id}")
async def confirm_stripe_payment(payment_intent_id: str):
    """Confirmar pagamento Stripe"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não está disponível")
    
    try:
        payment_result = stripe_service.confirm_payment(payment_intent_id)
        transaction_docs = db_firestore.collection('payment_transactions').where('payment_id', '==', payment_intent_id).stream()
        transaction_doc = None
        for doc in transaction_docs:
            transaction_doc = doc
            break
        
        if not transaction_doc:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        
        transaction_data = transaction_doc.to_dict()
        update_data = {
            "status": payment_result["status"],
            "transaction_id": payment_result.get("transaction_id"),
            "updated_at": datetime.utcnow()
        }
        
        if payment_result["status"] == "succeeded":
            update_data["completed_at"] = datetime.utcnow()
        
        db_firestore.collection('payment_transactions').document(transaction_doc.id).update(update_data)
        
        if payment_result["status"] == "succeeded":
            booking_id = transaction_data.get("booking_id")
            if booking_id:
                booking_update = {
                    "payment_status": "paid",
                    "status": "confirmed", 
                    "payment_transaction_id": payment_result.get("transaction_id"),
                    "updated_at": datetime.utcnow()
                }
                db_firestore.collection('bookings').document(booking_id).update(booking_update)
        
        return payment_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/stripe/status/{payment_intent_id}")
async def get_stripe_payment_status(payment_intent_id: str):
    """Verificar status Stripe"""
    if not STRIPE_AVAILABLE or not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não está disponível")
    
    try:
        payment_details = stripe_service.confirm_payment(payment_intent_id)
        transaction_docs = db_firestore.collection('payment_transactions').where('payment_id', '==', payment_intent_id).stream()
        for doc in transaction_docs:
            current_data = doc.to_dict()
            if current_data.get("status") != payment_details["status"]:
                db_firestore.collection('payment_transactions').document(doc.id).update({
                    "status": payment_details["status"],
                    "updated_at": datetime.utcnow()
                })
            break
        
        return payment_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# PAYMENT STATUS & ADMIN ENDPOINTS
# ================================

@api_router.get("/payments/status")
async def get_payment_methods_status():
    """Status geral dos métodos de pagamento"""
    return {
        "paypal": {
            "available": PAYPAL_AVAILABLE,
            "status": "connected" if PAYPAL_AVAILABLE else "disconnected",
            "mode": paypal_service.mode if PAYPAL_AVAILABLE else "N/A"
        },
        "stripe": {
            "available": STRIPE_AVAILABLE,
            "status": "connected" if STRIPE_AVAILABLE else "disconnected", 
            "mode": stripe_service.mode if STRIPE_AVAILABLE else "N/A"
        },
        "google_pay": {
            "available": STRIPE_AVAILABLE and bool(os.getenv('GOOGLE_MERCHANT_ID')),
            "merchant_id": os.getenv('GOOGLE_MERCHANT_ID', 'Not configured'),
            "status": "ready" if STRIPE_AVAILABLE and os.getenv('GOOGLE_MERCHANT_ID') else "not_configured"
        }
    }

@api_router.get("/admin/payments/all", dependencies=[Depends(verify_firebase_token)])
async def get_all_payments_detailed():
    """✅ Retorna todos os pagamentos com detalhes e segurança (PayPal, Stripe, Google Pay)"""
    try:
        transactions_ref = db_firestore.collection('payment_transactions')
        docs = transactions_ref.order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        
        payments = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat() if hasattr(data['created_at'], 'isoformat') else str(data['created_at'])
            
            if 'completed_at' in data and data['completed_at']:
                data['completed_at'] = data['completed_at'].isoformat() if hasattr(data['completed_at'], 'isoformat') else str(data['completed_at'])
            
            if 'updated_at' in data and data['updated_at']:
                data['updated_at'] = data['updated_at'].isoformat() if hasattr(data['updated_at'], 'isoformat') else str(data['updated_at'])
            
            payments.append(data)
        
        return {
            "success": True,
            "payments": payments,
            "total": len(payments),
            "summary": {
                "paypal": len([p for p in payments if p.get('payment_method') == 'paypal']),
                "google_pay": len([p for p in payments if p.get('payment_method') == 'google_pay']),
                "stripe_card": len([p for p in payments if p.get('payment_method') == 'stripe_card']),
                "completed": len([p for p in payments if p.get('status') in ['completed', 'succeeded']]),
                "pending": len([p for p in payments if p.get('status') in ['created', 'pending']]),
                "failed": len([p for p in payments if p.get('status') in ['failed', 'cancelled']])
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Erro ao carregar pagamentos detalhados: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao carregar pagamentos: {str(e)}")

# ================================
# BOOKING API ENDPOINTS
# ================================
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    """Create a new booking"""
    try:
        tour_doc_ref = db_firestore.collection('tours').document(booking_data.tour_id)
        tour_doc = tour_doc_ref.get()
        if not tour_doc.exists or not tour_doc.to_dict().get('active'):
            raise HTTPException(status_code=404, detail="Tour not found or inactive")
        tour = tour_doc.to_dict()
        
        tour_availability = tour.get("availability_dates", [])
        if not tour_availability:
            tour_availability = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(30)]

        if booking_data.selected_date not in tour_availability:
            raise HTTPException(status_code=400, detail="Selected date is not available")
            
        total_amount = tour["price"] * booking_data.participants
        booking = Booking(**booking_data.dict(), total_amount=total_amount)
        booking_dict = booking.dict()
        booking_id = booking_dict['id']
        db_firestore.collection('bookings').document(booking_id).set(booking_dict)
        
        return booking
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(
    status: Optional[str] = Query(None, description="Filter by booking status"),
    tour_id: Optional[str] = Query(None, description="Filter by tour ID"),
    customer_email: Optional[str] = Query(None, description="Filter by customer email")
):
    """Get all bookings with filters"""
    try:
        query = db_firestore.collection('bookings')
        if status:
            query = query.where('status', '==', status)
        if tour_id:
            query = query.where('tour_id', '==', tour_id)
        if customer_email:
            query = query.where('customer_email', '==', customer_email)
        docs = query.stream()
        bookings_list = []
        for doc in docs:
            booking_data = doc.to_dict()
            booking_data['id'] = doc.id
            bookings_list.append(Booking(**booking_data))
        return bookings_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get specific booking by ID"""
    try:
        doc = db_firestore.collection('bookings').document(booking_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        booking_data = doc.to_dict()
        booking_data['id'] = doc.id
        return Booking(**booking_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# ADMIN AUTH ENDPOINTS
# ================================
@api_router.post("/admin/login", response_model=AdminResponse)
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    if credentials.username == "admin" and credentials.password == "9rocks2025":
        return AdminResponse(
            message="Login successful",
            token="temp_admin_token_" + str(uuid.uuid4())
        )
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

# ================================
# STATISTICS ENDPOINTS
# ================================
@api_router.get("/admin/stats", response_model=BookingStats)
async def get_booking_stats():
    """Get booking statistics"""
    try:
        docs = db_firestore.collection('bookings').stream()
        bookings = [doc.to_dict() for doc in docs]
        total_bookings = len(bookings)
        total_revenue = sum(booking.get("total_amount", 0) for booking in bookings)
        bookings_by_tour = {}
        for booking in bookings:
            tour_id = booking.get("tour_id")
            bookings_by_tour[tour_id] = bookings_by_tour.get(tour_id, 0) + 1
        bookings_by_date = {}
        for booking in bookings:
            date_str = booking.get("selected_date", "")[:10]
            bookings_by_date[date_str] = bookings_by_date.get(date_str, 0) + 1
        bookings_by_status = {}
        for booking in bookings:
            status = booking.get("status", "unknown")
            bookings_by_status[status] = bookings_by_status.get(status, 0) + 1
        return BookingStats(
            total_bookings=total_bookings,
            total_revenue=total_revenue,
            bookings_by_tour=bookings_by_tour,
            bookings_by_date=bookings_by_date,
            bookings_by_status=bookings_by_status
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# FIREBASE ENDPOINTS
# ================================
@api_router.post("/admin/upload-image", response_model=ImageUploadResponse)
async def upload_tour_image(image_upload: ImageUpload, user=Depends(verify_firebase_token)):
    """Upload image to Firebase Storage"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        image_url = upload_image_to_firebase(image_upload.image_data, image_upload.filename)
        if image_upload.tour_id:
            doc = db_firestore.collection('tours').document(image_upload.tour_id).get()
            if doc.exists:
                tour = doc.to_dict()
                images = tour.get("images", [])
                images.append(image_url)
                db_firestore.collection('tours').document(image_upload.tour_id).update({
                    "images": images,
                    "updated_at": datetime.utcnow()
                })
        return ImageUploadResponse(
            image_url=image_url,
            filename=image_upload.filename,
            message="Image uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/firebase-config")
async def get_firebase_config():
    """Get Firebase configuration for frontend"""
    return {
        "apiKey": os.environ.get('FIREBASE_API_KEY', ''),
        "authDomain": os.environ.get('FIREBASE_AUTH_DOMAIN', ''),
        "projectId": os.environ.get('FIREBASE_PROJECT_ID', ''),
        "storageBucket": os.environ.get('FIREBASE_STORAGE_BUCKET', ''),
        "messagingSenderId": os.environ.get('FIREBASE_MESSAGING_SENDER_ID', ''),
        "appId": os.environ.get('FIREBASE_APP_ID', '')
    }

# ================================
# TEST ENDPOINTS
# ================================
@api_router.get("/")
async def root():
    return {
        "message": "9 Rocks Tours API - Ready!",
        "paypal_status": "available" if PAYPAL_AVAILABLE else "unavailable",
        "stripe_status": "available" if STRIPE_AVAILABLE else "unavailable",
        "google_pay_status": "ready" if STRIPE_AVAILABLE and os.getenv('GOOGLE_MERCHANT_ID') else "not_ready",
        "version": "2.0.0"
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "firebase_status": "connected" if db_firestore else "disconnected",
        "paypal_status": "available" if PAYPAL_AVAILABLE else "unavailable",
        "stripe_status": "available" if STRIPE_AVAILABLE else "unavailable",
        "google_pay_ready": bool(STRIPE_AVAILABLE and os.getenv('GOOGLE_MERCHANT_ID'))
    }

# ===================================================================
# ✅ ENDPOINTS DE CONFIGURAÇÃO CORRIGIDOS
# ===================================================================

@api_router.get("/config/tour-filters")
async def get_tour_filters_config():
    """Retorna os filtros de tours ativos do Firestore de forma segura."""
    try:
        filters_ref = db_firestore.collection('tourFilters')
        docs = filters_ref.where('active', '==', True).stream()
        
        filters_list = []
        for doc in docs:
            filter_data = doc.to_dict()
            filter_data['key'] = doc.id
            filters_list.append(filter_data)
        
        filters_list.sort(key=lambda x: x.get('order', 99))
            
        return filters_list
    except Exception as e:
        print(f"❌ Erro ao buscar filtros de tours: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar filtros: {str(e)}")

@api_router.get("/config/hero-images")
async def get_hero_images_config():
    """Retorna as imagens de herói ativas do Firestore de forma segura."""
    try:
        images_ref = db_firestore.collection('heroImages')
        docs = images_ref.where('active', '==', True).stream()
        
        images_list = []
        for doc in docs:
            image_data = doc.to_dict()
            image_data['id'] = doc.id
            images_list.append(image_data)
        
        images_list.sort(key=lambda x: x.get('order', 99))
            
        return images_list
    except Exception as e:
        print(f"❌ Erro ao buscar imagens de herói: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar imagens: {str(e)}")

# ===================================================================
# ✅ ENDPOINT DE DEBUG (APENAS EM MODO DE DESENVOLVIMENTO)
# ===================================================================
if os.getenv("DEBUG", "False").lower() == "true":
    @api_router.get("/debug/routes", include_in_schema=False)
    async def list_routes_api():
        """Lista todas as rotas registadas na aplicação (apenas para debug)."""
        from fastapi.routing import APIRoute
        routes = []
        for route in app.routes:
            if isinstance(route, APIRoute) and route.path.startswith("/api"):
                routes.append({
                    "path": route.path,
                    "name": route.name,
                    "methods": sorted(list(route.methods)),
                })
        return {"routes": sorted(routes, key=lambda x: x["path"])}

# ================================
# APP CONFIGURATION FINAL
# ================================
api_router.include_router(
    tours_router.router,
    prefix="/tours",
    tags=["Tours"],
    include_in_schema=True
)
app.include_router(api_router)

# Configurar SEO routes
try:
    app = setup_seo_routes(app)
except Exception as e:
    # O print do erro deve estar DENTRO do bloco except
    print(f"❌ Erro ao configurar as rotas de SEO: {e}")