# backend/models/booking.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict, List, Any
import uuid

# ============================================================================
# ✅ ADICIONADO: Modelo para criar uma nova reserva (faltava este)
# ============================================================================
class BookingCreate(BaseModel):
    tour_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    selected_date: str
    participants: int
    special_requests: Optional[str] = None
    payment_method: Optional[str] = None

# Modelo para estatísticas de reservas (já existia, mantido)
class BookingStats(BaseModel):
    total_bookings: int
    total_revenue: float
    bookings_by_tour: Dict[str, int]
    bookings_by_date: Dict[str, int]
    bookings_by_status: Dict[str, int]

# Modelo para atualização de reservas (já existia, mantido)
class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[str] = None

# Modelo principal para uma reserva (já existia, mantido)
class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    selected_date: str
    participants: int
    total_amount: float
    special_requests: Optional[str] = None
    payment_method: Optional[str] = None
    status: str = "pending"
    payment_status: str = "pending"
    payment_transaction_id: Optional[str] = None
    date_blocked: bool = False
    date_blocked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Mantive a configuração para garantir compatibilidade
        json_encoders = {
            datetime: lambda dt: dt.isoformat() + "Z"
        }
        extra = "allow"