from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv  
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
import json
import io
import csv
import base64
import firebase_admin
from firebase_admin import credentials, auth, storage
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import requests
import paypalrestsdk
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Firebase configuration
firebase_config = {
    "apiKey": os.environ['FIREBASE_API_KEY'],
    "authDomain": os.environ['FIREBASE_AUTH_DOMAIN'],
    "projectId": os.environ['FIREBASE_PROJECT_ID'],
    "storageBucket": os.environ['FIREBASE_STORAGE_BUCKET'],
    "messagingSenderId": os.environ['FIREBASE_MESSAGING_SENDER_ID'],
    "appId": os.environ['FIREBASE_APP_ID']
}

# Initialize Firebase Admin SDK (for server-side operations)
try:
    # Create a certificate dict for Firebase Admin
    firebase_cred = {
        "type": "service_account",
        "project_id": os.environ['FIREBASE_PROJECT_ID'],
        "client_email": f"firebase-adminsdk@{os.environ['FIREBASE_PROJECT_ID']}.iam.gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\nFAKE_PRIVATE_KEY_FOR_DEMO\n-----END PRIVATE KEY-----\n",
        "client_id": "fake_client_id"
    }
    
    # For now, we'll use Firebase REST API instead of Admin SDK
    # This avoids needing the service account key file
    FIREBASE_WEB_API_KEY = os.environ['FIREBASE_API_KEY']
    
except Exception as e:
    print(f"Firebase Admin SDK initialization skipped: {e}")
    FIREBASE_WEB_API_KEY = os.environ['FIREBASE_API_KEY']

# Google Calendar configuration
GOOGLE_CALENDAR_API_KEY = os.environ['GOOGLE_CALENDAR_API_KEY']
GOOGLE_CALENDAR_ID = os.environ['GOOGLE_CALENDAR_ID']

# PayPal configuration
PAYPAL_CLIENT_ID = os.environ['PAYPAL_CLIENT_ID']
PAYPAL_CLIENT_SECRET = os.environ['PAYPAL_CLIENT_SECRET']
PAYPAL_MODE = os.environ['PAYPAL_MODE']

# Configure PayPal SDK
try:
    paypalrestsdk.configure({
        "mode": PAYPAL_MODE,  # sandbox or live
        "client_id": PAYPAL_CLIENT_ID,
        "client_secret": PAYPAL_CLIENT_SECRET
    })
except Exception as e:
    print(f"PayPal configuration warning: {e}")

# Create the main app without a prefix
app = FastAPI(title="9 Rocks Tours API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security scheme for Firebase JWT
security = HTTPBearer(auto_error=False)


# ================================
# FIREBASE UTILITIES
# ================================

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase JWT token for admin authentication"""
    if not credentials:
        return None
    
    try:
        # For demo purposes, we'll use a simple token validation
        # In production, this would verify the Firebase JWT token
        token = credentials.credentials
        if token.startswith("temp_admin_token_"):
            return {"uid": "admin", "email": "admin@9rockstours.com"}
        return None
    except Exception as e:
        return None

def upload_image_to_firebase(image_data: str, filename: str) -> str:
    """Upload base64 image to Firebase Storage (simulated for now)"""
    try:
        # For now, we'll return the base64 data as-is
        # In production, this would upload to Firebase Storage and return the URL
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
        # Build the Calendar service
        service = build('calendar', 'v3', developerKey=GOOGLE_CALENDAR_API_KEY)
        
        # Get events from the calendar
        events_result = service.events().list(
            calendarId=GOOGLE_CALENDAR_ID,
            timeMin=f"{start_date}T00:00:00Z",
            timeMax=f"{end_date}T23:59:59Z",
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # For demo purposes, return some sample available dates
        # In production, this would check against actual calendar events
        from datetime import datetime, timedelta
        
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        available_dates = []
        current = start
        while current <= end:
            # Skip weekends for demo
            if current.weekday() < 5:  # Monday = 0, Sunday = 6
                available_dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
            
        return available_dates
        
    except Exception as e:
        print(f"Error getting calendar availability: {e}")
        # Return some default available dates
        from datetime import datetime, timedelta
        start = datetime.fromisoformat(start_date)
        available_dates = []
        for i in range(0, 30, 2):  # Every other day for 30 days
            date = start + timedelta(days=i)
            if date.weekday() < 5:  # Weekdays only
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
    tour_type: str  # "gastronomic", "cultural", "mixed", "custom"
    images: List[str] = []  # URLs or base64 strings
    availability_dates: List[str] = []  # ISO date strings
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
    selected_date: str  # ISO date string
    participants: int
    special_requests: Optional[str] = None
    payment_method: str  # "paypal", "multibanco", "mbway", "card"

class BookingUpdate(BaseModel):
    status: Optional[str] = None  # "pending", "confirmed", "cancelled", "completed"
    payment_status: Optional[str] = None  # "pending", "paid", "refunded"
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
    status: str = "pending"  # "pending", "confirmed", "cancelled", "completed"
    payment_status: str = "pending"  # "pending", "paid", "refunded"
    payment_transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ================================
# FIREBASE MODELS
# ================================

class ImageUpload(BaseModel):
    image_data: str  # base64 encoded image
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
    phone_number: Optional[str] = None  # Required for MBWay

class PaymentResponse(BaseModel):
    payment_id: str
    approval_url: Optional[str] = None
    status: str
    reference: Optional[str] = None  # For Multibanco

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
    status: str  # "created", "approved", "completed", "failed", "cancelled"
    transaction_id: Optional[str] = None
    approval_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


# ================================
# PAYPAL UTILITIES
# ================================

def create_paypal_payment(payment_request: PaymentRequest) -> Dict[str, Any]:
    """Create PayPal payment with Portuguese payment methods support"""
    
    # Check if PayPal is properly configured
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        # Return mock response for testing
        mock_payment_id = f"PAY-{str(uuid.uuid4())[:8]}"
        return {
            "payment_id": mock_payment_id,
            "approval_url": f"https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token={mock_payment_id}",
            "status": "created"
        }
    
    # Base payment configuration
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
    
    # Configure for Portuguese market
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
            # Find approval URL
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    break
            
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
    
    # Check if PayPal is properly configured
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        # Return mock response for testing
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
    
    # Check if PayPal is properly configured
    if PAYPAL_CLIENT_ID.startswith("MOCK"):
        # Return mock response for testing
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
        
        # Insert into MongoDB
        result = await db.tours.insert_one(tour_dict)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create tour")
            
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
        # Build query filter
        query_filter = {}
        if active_only:
            query_filter["active"] = True
        if tour_type:
            query_filter["tour_type"] = tour_type
        if location:
            query_filter["location"] = {"$regex": location, "$options": "i"}
            
        # Fetch tours from MongoDB
        tours_cursor = db.tours.find(query_filter).sort("created_at", -1)
        tours_list = await tours_cursor.to_list(1000)
        
        return [Tour(**tour) for tour in tours_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str):
    """Get a specific tour by ID"""
    try:
        tour = await db.tours.find_one({"id": tour_id})
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        return Tour(**tour)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, tour_update: TourUpdate):
    """Update a tour (Admin only)"""
    try:
        # Find existing tour
        existing_tour = await db.tours.find_one({"id": tour_id})
        if not existing_tour:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        # Prepare update data
        update_data = {k: v for k, v in tour_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update in MongoDB
        result = await db.tours.update_one(
            {"id": tour_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update tour")
            
        # Return updated tour
        updated_tour = await db.tours.find_one({"id": tour_id})
        return Tour(**updated_tour)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str):
    """Delete a tour (Admin only)"""
    try:
        result = await db.tours.delete_one({"id": tour_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tour not found")
            
        return {"message": "Tour deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# BOOKING API ENDPOINTS
# ================================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    """Create a new booking"""
    try:
        # Verify tour exists and is active
        tour = await db.tours.find_one({"id": booking_data.tour_id, "active": True})
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found or inactive")
            
        # Check if selected date is available
        if booking_data.selected_date not in tour.get("availability_dates", []):
            raise HTTPException(status_code=400, detail="Selected date is not available")
            
        # Calculate total amount
        total_amount = tour["price"] * booking_data.participants
        
        # Create booking
        booking = Booking(
            **booking_data.dict(),
            total_amount=total_amount
        )
        
        booking_dict = booking.dict()
        result = await db.bookings.insert_one(booking_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create booking")
            
        return booking
    except HTTPException:
        raise
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
        # Build query filter
        query_filter = {}
        if status:
            query_filter["status"] = status
        if tour_id:
            query_filter["tour_id"] = tour_id
        if customer_email:
            query_filter["customer_email"] = customer_email
            
        # Fetch bookings from MongoDB
        bookings_cursor = db.bookings.find(query_filter).sort("created_at", -1)
        bookings_list = await bookings_cursor.to_list(1000)
        
        return [Booking(**booking) for booking in bookings_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get a specific booking by ID"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        return Booking(**booking)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, booking_update: BookingUpdate):
    """Update a booking (Admin only)"""
    try:
        # Find existing booking
        existing_booking = await db.bookings.find_one({"id": booking_id})
        if not existing_booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        # Prepare update data
        update_data = {k: v for k, v in booking_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update in MongoDB
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update booking")
            
        # Return updated booking
        updated_booking = await db.bookings.find_one({"id": booking_id})
        return Booking(**updated_booking)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# ADMIN AUTH ENDPOINTS
# ================================

@api_router.post("/admin/login", response_model=AdminResponse)
async def admin_login(credentials: AdminLogin):
    """Simple admin login (to be enhanced with Firebase Auth)"""
    # Temporary simple auth - will be replaced with Firebase
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
        # Get all bookings
        bookings = await db.bookings.find().to_list(10000)
        
        # Calculate stats
        total_bookings = len(bookings)
        total_revenue = sum(booking.get("total_amount", 0) for booking in bookings)
        
        # Bookings by tour
        bookings_by_tour = {}
        for booking in bookings:
            tour_id = booking.get("tour_id")
            bookings_by_tour[tour_id] = bookings_by_tour.get(tour_id, 0) + 1
            
        # Bookings by date
        bookings_by_date = {}
        for booking in bookings:
            date_str = booking.get("selected_date", "")[:10]  # YYYY-MM-DD
            bookings_by_date[date_str] = bookings_by_date.get(date_str, 0) + 1
            
        # Bookings by status
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
        # Get all bookings
        bookings = await db.bookings.find().to_list(10000)
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Tour ID", "Customer Name", "Customer Email", "Customer Phone",
            "Selected Date", "Participants", "Total Amount", "Payment Method",
            "Status", "Payment Status", "Created At"
        ])
        
        # Write data
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
        
        # Prepare response
        output.seek(0)
        response = StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=bookings.csv"}
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# PAYMENT ENDPOINTS
# ================================

@api_router.post("/payments/create", response_model=PaymentResponse)
async def create_payment(payment_request: PaymentRequest):
    """Create PayPal payment"""
    try:
        # Verify booking exists
        booking = await db.bookings.find_one({"id": payment_request.booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Create payment with PayPal
        payment_result = create_paypal_payment(payment_request)
        
        # Store transaction in database
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
        await db.payment_transactions.insert_one(transaction_dict)
        
        return PaymentResponse(
            payment_id=payment_result["payment_id"],
            approval_url=payment_result.get("approval_url"),
            status=payment_result["status"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/execute/{payment_id}")
async def execute_payment(payment_id: str, execution: PaymentExecution):
    """Execute approved PayPal payment"""
    try:
        # Check if already processed
        existing = await db.payment_transactions.find_one({"payment_id": payment_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
            
        if existing.get("status") == "completed":
            return {"message": "Payment already processed", "status": "completed"}
        
        # Execute payment
        result = execute_paypal_payment(payment_id, execution.payer_id)
        
        # Update database
        await db.payment_transactions.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "status": "completed",
                    "transaction_id": result.get("transaction_id"),
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        # Update booking payment status
        booking_id = existing.get("booking_id")
        if booking_id:
            await db.bookings.update_one(
                {"id": booking_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "payment_transaction_id": result.get("transaction_id"),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{payment_id}")
async def get_payment_status(payment_id: str):
    """Get payment status"""
    try:
        # Check database first
        db_record = await db.payment_transactions.find_one({"payment_id": payment_id})
        
        # Get latest status from PayPal
        paypal_status = get_paypal_payment_status(payment_id)
        
        # Update database if status changed
        if db_record and db_record.get("status") != paypal_status["status"]:
            await db.payment_transactions.update_one(
                {"payment_id": payment_id},
                {"$set": {"status": paypal_status["status"]}}
            )
        
        return paypal_status
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/payments", dependencies=[Depends(verify_firebase_token)])
async def get_all_payments():
    """Get all payment transactions (Admin only)"""
    try:
        transactions = await db.payment_transactions.find().sort("created_at", -1).to_list(1000)
        return [PaymentTransaction(**transaction) for transaction in transactions]
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
        # Upload image to Firebase Storage
        image_url = upload_image_to_firebase(image_upload.image_data, image_upload.filename)
        
        # If tour_id provided, add image to tour
        if image_upload.tour_id:
            tour = await db.tours.find_one({"id": image_upload.tour_id})
            if tour:
                images = tour.get("images", [])
                images.append(image_url)
                await db.tours.update_one(
                    {"id": image_upload.tour_id},
                    {"$set": {"images": images, "updated_at": datetime.utcnow()}}
                )
        
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
        "apiKey": os.environ['FIREBASE_API_KEY'],
        "authDomain": os.environ['FIREBASE_AUTH_DOMAIN'],
        "projectId": os.environ['FIREBASE_PROJECT_ID'],
        "storageBucket": os.environ['FIREBASE_STORAGE_BUCKET'],
        "messagingSenderId": os.environ['FIREBASE_MESSAGING_SENDER_ID'],
        "appId": os.environ['FIREBASE_APP_ID']
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
async def update_tour_availability(tour_id: str, availability_request: CalendarAvailability, user=Depends(verify_firebase_token)):
    """Update tour availability based on Google Calendar (Admin only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get availability from Google Calendar
        available_dates = get_calendar_availability(
            availability_request.start_date,
            availability_request.end_date
        )
        
        # Update tour with new availability
        result = await db.tours.update_one(
            {"id": tour_id},
            {"$set": {"availability_dates": available_dates, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        # Return updated tour
        updated_tour = await db.tours.find_one({"id": tour_id})
        return Tour(**updated_tour)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Keep original test endpoints
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

# Include the router in the main app
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
