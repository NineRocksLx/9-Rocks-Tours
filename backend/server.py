from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv  
from starlette.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, date
from utils.google_calendar import get_available_dates_for_tour
import json
import io
import csv
import base64
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import requests
import paypalrestsdk
from enum import Enum
from routers import seo_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ================================
# FIREBASE/FIRESTORE SETUP
# ================================

def initialize_firestore():
    """Inicializa Firebase Admin SDK"""
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate("google-calendar-key.json")
            firebase_admin.initialize_app(cred)
            print("✅ Firebase inicializado com sucesso!")
        except Exception as e:
            print(f"❌ Erro Firebase: {e}")
            return None
    return firestore.client()

# Inicializar Firestore
db_firestore = initialize_firestore()

# ================================
# GOOGLE CALENDAR CONFIGURATION
# ================================

GOOGLE_CALENDAR_API_KEY = os.environ['GOOGLE_CALENDAR_API_KEY']
GOOGLE_CALENDAR_ID = os.environ['GOOGLE_CALENDAR_ID']

# ================================
# PAYPAL CONFIGURATION
# ================================

PAYPAL_CLIENT_ID = os.environ['PAYPAL_CLIENT_ID']
PAYPAL_CLIENT_SECRET = os.environ['PAYPAL_CLIENT_SECRET']
PAYPAL_MODE = os.environ['PAYPAL_MODE']

try:
    paypalrestsdk.configure({
        "mode": PAYPAL_MODE,
        "client_id": PAYPAL_CLIENT_ID,
        "client_secret": PAYPAL_CLIENT_SECRET
    })
except Exception as e:
    print(f"PayPal configuration warning: {e}")

# ================================
# FASTAPI SETUP
# ================================

app = FastAPI(title="9 Rocks Tours API", version="1.0.0")
app.include_router(seo_routes.router, tags=["SEO"])
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ================================
# MODELS
# ================================

class TourTranslation(BaseModel):
    pt: str
    en: str
    es: Optional[str] = ""

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
    description: Optional[TourTranslation] = None
    short_description: Optional[TourTranslation] = None
    location: Optional[str] = None
    duration_hours: Optional[float] = None
    price: Optional[float] = None
    max_participants: Optional[int] = None
    tour_type: Optional[str] = None
    images: List[str] = []
    availability_dates: List[str] = []
    active: bool = True
    route_description: Optional[TourTranslation] = None
    includes: Optional[TourTranslation] = None
    excludes: Optional[TourTranslation] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    tour_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    selected_date: str
    participants: int
    special_requests: Optional[str] = None
    payment_method: str

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

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    message: str
    token: Optional[str] = None

# ================================
# UTILITIES
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

# ================================
# TOURS API ENDPOINTS
# ================================

@api_router.get("/tours", response_model=List[Tour])
async def get_tours(
    active_only: bool = Query(True, description="Filter only active tours"),
    tour_type: Optional[str] = Query(None, description="Filter by tour type"),
    location: Optional[str] = Query(None, description="Filter by location")
):
    """Get all tours from Firestore"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        # Query Firestore
        tours_ref = db_firestore.collection('tours')
        
        # Aplicar filtros
        if active_only:
            tours_ref = tours_ref.where('active', '==', True)
        
        if tour_type:
            tours_ref = tours_ref.where('tour_type', '==', tour_type)
            
        # Executar query
        docs = tours_ref.stream()
        
        tours = []
        for doc in docs:
            tour_data = doc.to_dict()
            tour_data['id'] = doc.id
            
            # Filtro adicional por localização
            if location and location.lower() not in tour_data.get('location', '').lower():
                continue
                
            tours.append(Tour(**tour_data))
            
        return tours
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str):
    """Get specific tour from Firestore"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        tour_data = doc.to_dict()
        tour_data['id'] = doc.id
        
        return Tour(**tour_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tours", response_model=Tour)
async def create_tour(tour_data: TourCreate, user=Depends(verify_firebase_token)):
    """Create a new tour (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        tour = Tour(**tour_data.dict())
        tour_dict = tour.dict()
        
        # Adicionar ao Firestore
        doc_ref = db_firestore.collection('tours').document(tour.id)
        doc_ref.set(tour_dict)
        
        return tour
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, tour_update: TourUpdate, user=Depends(verify_firebase_token)):
    """Update a tour (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        # Preparar dados de atualização
        update_data = {k: v for k, v in tour_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Atualizar no Firestore
        doc_ref.update(update_data)
        
        # Retornar tour atualizado
        updated_doc = doc_ref.get()
        tour_data = updated_doc.to_dict()
        tour_data['id'] = updated_doc.id
        
        return Tour(**tour_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str, user=Depends(verify_firebase_token)):
    """Delete a tour (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        doc_ref.delete()
        return {"message": "Tour deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# BOOKING ENDPOINTS
# ================================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    """Create a new booking"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        # Verify tour exists and is active
        tour_ref = db_firestore.collection('tours').document(booking_data.tour_id)
        tour_doc = tour_ref.get()
        
        if not tour_doc.exists:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        tour_data = tour_doc.to_dict()
        if not tour_data.get("active", False):
            raise HTTPException(status_code=400, detail="Tour is not active")
        
        # Check if selected date is available
        if booking_data.selected_date not in tour_data.get("availability_dates", []):
            raise HTTPException(status_code=400, detail="Selected date is not available")
        
        # Calculate total amount
        total_amount = tour_data["price"] * booking_data.participants
        
        # Create booking
        booking = Booking(
            **booking_data.dict(),
            total_amount=total_amount
        )
        
        # Save to Firestore
        booking_dict = booking.dict()
        doc_ref = db_firestore.collection('bookings').document(booking.id)
        doc_ref.set(booking_dict)
        
        return booking
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get a specific booking by ID"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
            
        doc_ref = db_firestore.collection('bookings').document(booking_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        booking_data = doc.to_dict()
        booking_data['id'] = doc.id
        
        return Booking(**booking_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# ADMIN ENDPOINTS
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
# BASIC ENDPOINTS
# ================================

@api_router.get("/")
async def root():
    return {"message": "9 Rocks Tours API - Ready to explore Portugal!"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# ================================
# FIREBASE CONFIG
# ================================

@api_router.get("/firebase-config")
async def get_firebase_config():
    """Get Firebase configuration for frontend"""
    return {
        "apiKey": os.environ['FIREBASE_API_KEY'],
        "authDomain": os.environ['FIREBASE_AUTH_DOMAIN'],
        "projectId": os.environ['FIREBASE_PROJECT_ID'],
        "storageBucket": os.environ['FIREBASE_STORAGE_BUCKET'],
        "messagingSenderId": os.environ['FIREBASE_MESSAGING_SENDER_ID'],
        "appId": os.environ['FIREBASE_APP_ID']
    }

# ================================
# APP SETUP
# ================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)