# backend/models/payment.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import datetime

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
    id: str
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
    created_at: datetime
    completed_at: Optional[datetime] = None

class CreatePaymentIntentRequest(BaseModel):
    amount: float
    currency: str = "EUR"
    tour_id: str
    booking_id: str
    customer_email: str
    customer_name: str
    tour_name: Optional[str] = None
    participants: Optional[int] = 1