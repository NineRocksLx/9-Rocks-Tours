# ================================
# IMPORTS CORRIGIDOS
# ================================
import sys  # ✅ ADICIONADO
import firebase_admin  # ✅ ADICIONADO - estava faltando
from firebase_admin import credentials, firestore
from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta  # ✅ ADICIONADO timedelta
import json
import io
import csv
import base64
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import paypalrestsdk
from enum import Enum
from routers.seo_routes import setup_seo_routes

# Set up root directory and load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ================================
# FIREBASE INITIALIZATION CORRIGIDA
# ================================
db_firestore = None  # ✅ Inicialização da variável

try:
    # Verificar se já foi inicializado (evitar conflitos com seo_routes)
    try:
        firebase_admin.get_app()
        print("Firebase já inicializado anteriormente.")
    except ValueError:
        # Se não foi inicializado, inicializar agora
        cred = credentials.Certificate("google-calendar-key.json")
        firebase_admin.initialize_app(cred, {
            'projectId': 'tours-81516-acfbc',
        })
        print("Firebase inicializado com sucesso no server.py")
    
    # ✅ CRIAR CLIENTE FIRESTORE
    db_firestore = firestore.client()
    print("Cliente Firestore criado com sucesso.")
    
except FileNotFoundError as e:
    print(f"Erro: Arquivo de chave de conta de serviço não encontrado: {e}", file=sys.stderr)
    sys.exit(1)
except ValueError as e:
    print(f"Erro: Falha ao inicializar Firebase: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Erro inesperado durante inicialização do Firebase: {e}", file=sys.stderr)
    sys.exit(1)

# ================================
# FASTAPI APP INITIALIZATION
# ================================
app = FastAPI(
    title="9 Rocks Tours API",
    description="API completa para gestão de tours em Portugal",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security scheme for Firebase JWT
security = HTTPBearer(auto_error=False)

# ================================
# PAYPAL CONFIGURATION
# ================================
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'MOCK_PAYPAL_CLIENT_ID')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'MOCK_PAYPAL_CLIENT_SECRET')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')

# Configure PayPal SDK
try:
    paypalrestsdk.configure({
        "mode": PAYPAL_MODE,
        "client_id": PAYPAL_CLIENT_ID,
        "client_secret": PAYPAL_CLIENT_SECRET
    })
    print("PayPal configurado com sucesso")
except Exception as e:
    print(f"Aviso na configuração PayPal: {e}")

# ================================
# GOOGLE CALENDAR CONFIGURATION
# ================================
GOOGLE_CALENDAR_API_KEY = os.environ.get('GOOGLE_CALENDAR_API_KEY', '')
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', '')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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
    except Exception as e:
        return None

def upload_image_to_firebase(image_data: str, filename: str) -> str:
    """Upload base64 image to Firebase Storage (simulated for now)"""
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
            if current.weekday() < 5:  # Weekdays only
                available_dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)  # ✅ Agora timedelta está importado
        return available_dates
    except Exception as e:
        print(f"Error getting calendar availability: {e}")
        start = datetime.fromisoformat(start_date)
        available_dates = []
        for i in range(0, 30, 2):
            date = start + timedelta(days=i)
            if date.weekday() < 5:
                available_dates.append(date.strftime("%Y-%m-%d"))
        return available_dates

# ================================
# TOUR MANAGEMENT MODELS
# ================================
class TourTranslation(BaseModel):
    pt: str
    en: str
    es: str

class TourCreate(BaseModel):
    name: TourTranslation
    description: TourTranslation
    short_description: TourTranslation
    location: str
    duration_hours: float
    price: float
    max_participants: int
    tour_type: str
    images: List[str] = []
    availability_dates: List[str] = []
    active: bool = True
    route_description: TourTranslation
    includes: TourTranslation
    excludes: TourTranslation

class TourUpdate(BaseModel):
    name: Optional[TourTranslation] = None
    description: Optional[TourTranslation] = None
    short_description: Optional[TourTranslation] = None
    location: Optional[str] = None
    duration_hours: Optional[float] = None
    price: Optional[float] = None
    max_participants: Optional[int] = None
    tour_type: Optional[str] = None
    images: Optional[List[str]] = None
    availability_dates: Optional[List[str]] = None
    active: Optional[bool] = None
    route_description: Optional[TourTranslation] = None
    includes: Optional[TourTranslation] = None
    excludes: Optional[TourTranslation] = None

class Tour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: TourTranslation
    description: TourTranslation
    short_description: TourTranslation
    location: str
    duration_hours: float
    price: float
    max_participants: int
    tour_type: str
    images: List[str] = []
    availability_dates: List[str] = []
    active: bool = True
    route_description: TourTranslation
    includes: TourTranslation
    excludes: TourTranslation
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
# PAYMENT MODELS
# ================================
class PaymentMethod(str, Enum):
    PAYPAL = "paypal"
    MULTIBANCO = "multibanco"
    MBWAY = "mbway"
    CREDIT_CARD = "credit_card"

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
    status: str
    reference: Optional[str] = None

class PaymentExecution(BaseModel):
    payer_id: str

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# ================================
# PAYPAL UTILITIES
# ================================
def create_paypal_payment(payment_request: PaymentRequest) -> Dict[str, Any]:
    """Create PayPal payment with Portuguese payment methods support"""
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        mock_payment_id = f"PAY-{str(uuid.uuid4())[:8]}"
        return {
            "payment_id": mock_payment_id,
            "approval_url": f"https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token={mock_payment_id}",
            "status": "created"
        }
    
    payment_data = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": payment_request.return_url,
            "cancel_url": payment_request.cancel_url
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": f"9 Rocks Tours - Booking {payment_request.booking_id}",
                    "sku": payment_request.tour_id,
                    "price": str(payment_request.amount),
                    "currency": payment_request.currency,
                    "quantity": 1
                }]
            },
            "amount": {
                "total": str(payment_request.amount),
                "currency": payment_request.currency
            },
            "description": f"Tour booking payment for {payment_request.customer_name}"
        }]
    }
    
    if payment_request.payment_method == PaymentMethod.MULTIBANCO:
        payment_data["payer"]["payment_method"] = "multibanco"
        payment_data["payer"]["funding_instruments"] = [{
            "multibanco": {
                "country_code": "PT"
            }
        }]
    elif payment_request.payment_method == PaymentMethod.MBWAY:
        payment_data["payer"]["payment_method"] = "mbway"
        payment_data["payer"]["funding_instruments"] = [{
            "mbway": {
                "phone_number": payment_request.phone_number,
                "country_code": "PT"
            }
        }]
    
    try:
        payment = paypalrestsdk.Payment(payment_data)
        if payment.create():
            approval_url = next((link.href for link in payment.links if link.rel == "approval_url"), None)
            return {
                "payment_id": payment.id,
                "approval_url": approval_url,
                "status": payment.state
            }
        else:
            raise HTTPException(status_code=400, detail=f"Payment creation failed: {payment.error}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal API error: {str(e)}")

def execute_paypal_payment(payment_id: str, payer_id: str) -> Dict[str, Any]:
    """Execute approved PayPal payment"""
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        return {
            "payment_id": payment_id,
            "status": "approved",
            "transaction_id": f"TXN-{str(uuid.uuid4())[:8]}"
        }
    
    try:
        payment = paypalrestsdk.Payment.find(payment_id)
        if payment.execute({"payer_id": payer_id}):
            return {
                "payment_id": payment.id,
                "status": payment.state,
                "transaction_id": payment.transactions[0].related_resources[0].sale.id
            }
        else:
            raise HTTPException(status_code=400, detail=f"Payment execution failed: {payment.error}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment execution error: {str(e)}")

def get_paypal_payment_status(payment_id: str) -> Dict[str, Any]:
    """Get payment status"""
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        return {
            "payment_id": payment_id,
            "status": "approved",
            "amount": "65.00",
            "currency": "EUR"
        }
    
    try:
        payment = paypalrestsdk.Payment.find(payment_id)
        return {
            "payment_id": payment.id,
            "status": payment.state,
            "amount": payment.transactions[0].amount.total,
            "currency": payment.transactions[0].amount.currency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check error: {str(e)}")

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
# TOURS API ENDPOINTS
# ================================
@api_router.post("/tours", response_model=Tour)
async def create_tour(tour_data: TourCreate):
    """Create a new tour (Admin only)"""
    try:
        tour = Tour(**tour_data.dict())
        tour_dict = tour.dict()
        tour_id = tour_dict['id']
        db_firestore.collection('tours').document(tour_id).set(tour_dict)
        return tour
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/tours", response_model=List[Tour])
async def get_tours(
    active_only: bool = Query(True, description="Filter only active tours"),
    tour_type: Optional[str] = Query(None, description="Filter by tour type"),
    location: Optional[str] = Query(None, description="Filter by location")
):
    """Get all tours with optional filters"""
    try:
        query = db_firestore.collection('tours')
        if active_only:
            query = query.where('active', '==', True)
        if tour_type:
            query = query.where('tour_type', '==', tour_type)
        if location:
            query = query.where('location', '==', location)

        docs = query.stream()
        tours_list = []
        for doc in docs:
            tour_data = doc.to_dict()
            tour_data['id'] = doc.id
            tours_list.append(Tour(**tour_data))
        return tours_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tours: {str(e)}")

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str):
    """Get a specific tour by ID"""
    try:
        doc = db_firestore.collection('tours').document(tour_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
        tour_data = doc.to_dict()
        tour_data['id'] = doc.id
        return Tour(**tour_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, tour_update: TourUpdate):
    """Update a tour (Admin only)"""
    try:
        doc = db_firestore.collection('tours').document(tour_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
        update_data = {k: v for k, v in tour_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        db_firestore.collection('tours').document(tour_id).update(update_data)
        updated_doc = db_firestore.collection('tours').document(tour_id).get()
        tour_data = updated_doc.to_dict()
        tour_data['id'] = updated_doc.id
        return Tour(**tour_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str):
    """Delete a tour (Admin only)"""
    try:
        doc = db_firestore.collection('tours').document(tour_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
        db_firestore.collection('tours').document(tour_id).delete()
        return {"message": "Tour deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# BOOKING API ENDPOINTS
# ================================
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    """Create a new booking"""
    try:
        tour_doc = db_firestore.collection('tours').document(booking_data.tour_id).get()
        if not tour_doc.exists or not tour_doc.to_dict().get('active'):
            raise HTTPException(status_code=404, detail="Tour not found or inactive")
        tour = tour_doc.to_dict()
        if booking_data.selected_date not in tour.get("availability_dates", []):
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
    """Get all bookings with optional filters (Admin only)"""
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
    """Get a specific booking by ID"""
    try:
        doc = db_firestore.collection('bookings').document(booking_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        booking_data = doc.to_dict()
        booking_data['id'] = doc.id
        return Booking(**booking_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, booking_update: BookingUpdate):
    """Update a booking (Admin only)"""
    try:
        doc = db_firestore.collection('bookings').document(booking_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        update_data = {k: v for k, v in booking_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        db_firestore.collection('bookings').document(booking_id).update(update_data)
        updated_doc = db_firestore.collection('bookings').document(booking_id).get()
        booking_data = updated_doc.to_dict()
        booking_data['id'] = updated_doc.id
        return Booking(**booking_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# ADMIN AUTH ENDPOINTS
# ================================
@api_router.post("/admin/login", response_model=AdminResponse)
async def admin_login(credentials: AdminLogin):
    """Simple admin login (to be enhanced with Firebase Auth)"""
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
    """Get booking statistics (Admin only)"""
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

@api_router.get("/admin/export/bookings")
async def export_bookings_csv():
    """Export bookings as CSV (Admin only)"""
    try:
        docs = db_firestore.collection('bookings').stream()
        bookings = [doc.to_dict() for doc in docs]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Tour ID", "Customer Name", "Customer Email", "Customer Phone",
            "Selected Date", "Participants", "Total Amount", "Payment Method",
            "Status", "Payment Status", "Created At"
        ])
        for booking in bookings:
            writer.writerow([
                booking.get("id", ""),
                booking.get("tour_id", ""),
                booking.get("customer_name", ""),
                booking.get("customer_email", ""),
                booking.get("customer_phone", ""),
                booking.get("selected_date", ""),
                booking.get("participants", 0),
                booking.get("total_amount", 0),
                booking.get("payment_method", ""),
                booking.get("status", ""),
                booking.get("payment_status", ""),
                booking.get("created_at", "")
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=bookings.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# PAYMENT ENDPOINTS
# ================================
@api_router.post("/payments/create", response_model=PaymentResponse)
async def create_payment(payment_request: PaymentRequest):
    """Create PayPal payment"""
    try:
        doc = db_firestore.collection('bookings').document(payment_request.booking_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        payment_result = create_paypal_payment(payment_request)
        transaction = PaymentTransaction(
            payment_id=payment_result["payment_id"],
            booking_id=payment_request.booking_id,
            tour_id=payment_request.tour_id,
            customer_email=payment_request.customer_email,
            customer_name=payment_request.customer_name,
            amount=payment_request.amount,
            currency=payment_request.currency,
            payment_method=payment_request.payment_method.value,
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/execute/{payment_id}")
async def execute_payment(payment_id: str, execution: PaymentExecution):
    """Execute approved PayPal payment"""
    try:
        doc = db_firestore.collection('payment_transactions').document(payment_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        existing = doc.to_dict()
        if existing.get("status") == "completed":
            return {"message": "Payment already processed", "status": "completed"}
        result = execute_paypal_payment(payment_id, execution.payer_id)
        db_firestore.collection('payment_transactions').document(payment_id).update({
            "status": "completed",
            "transaction_id": result.get("transaction_id"),
            "completed_at": datetime.utcnow()
        })
        booking_id = existing.get("booking_id")
        if booking_id:
            db_firestore.collection('bookings').document(booking_id).update({
                "payment_status": "paid",
                "status": "confirmed",
                "payment_transaction_id": result.get("transaction_id"),
                "updated_at": datetime.utcnow()
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{payment_id}")
async def get_payment_status(payment_id: str):
    """Get payment status"""
    try:
        doc = db_firestore.collection('payment_transactions').document(payment_id).get()
        paypal_status = get_paypal_payment_status(payment_id)
        if doc.exists and doc.to_dict().get("status") != paypal_status["status"]:
            db_firestore.collection('payment_transactions').document(payment_id).update({
                "status": paypal_status["status"]
            })
        return paypal_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/payments", dependencies=[Depends(verify_firebase_token)])
async def get_all_payments():
    """Get all payment transactions (Admin only)"""
    try:
        docs = db_firestore.collection('payment_transactions').stream()
        transactions = [PaymentTransaction(**doc.to_dict()) for doc in docs]
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# FIREBASE ENDPOINTS
# ================================
@api_router.post("/admin/upload-image", response_model=ImageUploadResponse)
async def upload_tour_image(image_upload: ImageUpload, user=Depends(verify_firebase_token)):
    """Upload image to Firebase Storage (Admin only)"""
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
# GOOGLE CALENDAR ENDPOINTS
# ================================
@api_router.post("/admin/calendar/availability", response_model=CalendarAvailabilityResponse)
async def get_calendar_availability_range(availability_request: CalendarAvailability, user=Depends(verify_firebase_token)):
    """Get available dates from Google Calendar (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        available_dates = get_calendar_availability(
            availability_request.start_date,
            availability_request.end_date
        )
        return CalendarAvailabilityResponse(
            available_dates=available_dates,
            calendar_id=GOOGLE_CALENDAR_ID
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/tours/{tour_id}/availability")
async def update_tour_availability(
    tour_id: str,
    availability_request: CalendarAvailability,
    user=Depends(verify_firebase_token)
):
    """Update tour availability based on Google Calendar (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        doc = db_firestore.collection('tours').document(tour_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
        tour = doc.to_dict()
        tour_schedule = tour.get('availability_schedule', {
            'monday': {'active': True, 'start': '09:00', 'end': '18:00'},
            'tuesday': {'active': True, 'start': '09:00', 'end': '18:00'},
            'wednesday': {'active': True, 'start': '09:00', 'end': '18:00'},
            'thursday': {'active': True, 'start': '09:00', 'end': '18:00'},
            'friday': {'active': True, 'start': '09:00', 'end': '18:00'},
            'saturday': {'active': False},
            'sunday': {'active': False}
        })
        available_slots = get_calendar_availability(
            availability_request.start_date,
            availability_request.end_date
        )
        available_dates = available_slots
        db_firestore.collection('tours').document(tour_id).update({
            "availability_dates": available_dates,
            "availability_slots": available_slots,
            "last_calendar_sync": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        updated_doc = db_firestore.collection('tours').document(tour_id).get()
        tour_data = updated_doc.to_dict()
        tour_data['id'] = updated_doc.id
        return Tour(**tour_data)
    except Exception as e:
        logger.error(f"Error syncing calendar: {e}")
        raise HTTPException(status_code=500, detail=f"Calendar sync error: {str(e)}")

# ================================
# TEST ENDPOINTS
# ================================
@api_router.get("/")
async def root():
    return {"message": "9 Rocks Tours API - Ready to explore Portugal!"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "firebase_status": "connected" if db_firestore else "disconnected"
    }

# ================================
# APP CONFIGURATION
# ================================

# Include the router in the main app
app.include_router(api_router)

# Initialize SEO routes DEPOIS de configurar tudo
try:
    app = setup_seo_routes(app)
    print("SEO routes configuradas com sucesso")
except Exception as e:
    print(f"Erro ao configurar SEO routes: {e}")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "9 Rocks Tours API is running", "status": "healthy"}

@app.on_event("shutdown")
async def shutdown_db_client():
    print("API desligada com sucesso")
    pass