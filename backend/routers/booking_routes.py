from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import List
from google.cloud import firestore
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.transaction import Transaction

# Importação absoluta
from config.firestore_db import db

# ✅ CORREÇÃO: O prefixo foi removido. Será controlado pelo main.py.
router = APIRouter(
    tags=["Bookings V1"]
)

class BookingRequest(BaseModel):
    tour_id: str
    selected_date_iso: str
    user_name: str
    user_email: EmailStr
    num_participants: int

@firestore.transactional
def create_booking_in_transaction(transaction: Transaction, booking_ref: firestore.DocumentReference, booking_data: dict):
    """
    Executa a verificação e a escrita dentro de uma transação atómica do Firestore.
    """
    snapshot = booking_ref.get(transaction=transaction)
    if snapshot.exists:
        return False
    transaction.set(booking_ref, booking_data)
    return True

def parse_booking_date(iso_string: str) -> datetime:
    """
    Função melhorada para parsing consistente de datas
    """
    try:
        base_date = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        normalized_date = datetime(
            year=base_date.year, month=base_date.month, day=base_date.day,
            hour=12, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
        )
        return normalized_date
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato de data inválido: {iso_string}. Use o formato ISO 8601 UTC."
        )

def format_date_string(date_obj: datetime) -> str:
    """
    Formata datetime para string YYYY-MM-DD de forma consistente
    """
    return date_obj.strftime('%Y-%m-%d')

@router.get("/occupied-dates/{tour_id}", response_model=dict[str, List[str]])
async def get_occupied_dates(tour_id: str, db_client: Client = Depends(lambda: db)):
    """
    Retorna uma lista de datas ('YYYY-MM-DD') que já estão reservadas.
    """
    try:
        bookings_ref = db_client.collection("bookings")
        query = bookings_ref.where("tourId", "==", tour_id)
        docs = query.stream()
        occupied_dates = set()
        
        for doc in docs:
            booking = doc.to_dict()
            date_value = booking.get('bookingDate') or booking.get('date') or booking.get('selected_date')
            if date_value:
                if isinstance(date_value, datetime):
                    occupied_dates.add(format_date_string(date_value))
                elif isinstance(date_value, str) and len(date_value) >= 10:
                    occupied_dates.add(date_value[:10])
        
        occupied_dates_list = sorted(list(occupied_dates))
        return {"occupied_dates": occupied_dates_list}
    except Exception as e:
        print(f"❌ Erro ao buscar datas ocupadas para o tour {tour_id}: {e}")
        return {"occupied_dates": []}

@router.post("/book-tour", status_code=201)
async def book_tour(request: BookingRequest, db_client: Client = Depends(lambda: db)):
    """
    Endpoint para criar uma nova reserva de forma segura e atómica.
    """
    try:
        parsed_date = parse_booking_date(request.selected_date_iso)
        date_str_ymd = format_date_string(parsed_date)
        
        booking_id = f"{request.tour_id}_{date_str_ymd}"
        booking_ref = db_client.collection("bookings").document(booking_id)
        
        booking_data = {
            "tourId": request.tour_id,
            "bookingDate": parsed_date,
            "dateString": date_str_ymd,
            "userName": request.user_name,
            "userEmail": request.user_email,
            "numParticipants": request.num_participants,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "status": "confirmed",
            "originalDateInput": request.selected_date_iso,
            "version": "2.0"
        }

        was_successful = create_booking_in_transaction(db_client.transaction(), booking_ref, booking_data)

        if not was_successful:
            raise HTTPException(
                status_code=409, # Conflict
                detail=f"Esta data ({date_str_ymd}) para o tour selecionado já está reservada."
            )
        
        return {
            "status": "success", 
            "bookingId": booking_id,
            "dateBooked": date_str_ymd,
            "message": f"Reserva confirmada para {date_str_ymd}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro inesperado ao criar reserva: {e}")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno no servidor.")

@router.get("/check-date-availability/{tour_id}/{date}")
async def check_date_availability(tour_id: str, date: str, db_client: Client = Depends(lambda: db)):
    """
    Verifica se uma data específica está disponível para um tour.
    """
    try:
        booking_id = f"{tour_id}_{date}"
        booking_ref = db_client.collection("bookings").document(booking_id)
        doc = booking_ref.get()
        
        is_available = not doc.exists
        
        return {
            "tour_id": tour_id,
            "date": date,
            "is_available": is_available,
            "booking_id": booking_id if not is_available else None
        }
        
    except Exception as e:
        print(f"❌ Erro ao verificar disponibilidade da data: {e}")
        return {
            "tour_id": tour_id,
            "date": date,
            "is_available": False,
            "error": "Erro interno"
        }

@router.get("/stats/{tour_id}")
async def get_booking_stats(tour_id: str, db_client: Client = Depends(lambda: db)):
    """
    Retorna estatísticas de reservas para um tour específico.
    """
    try:
        bookings_ref = db_client.collection("bookings")
        query = bookings_ref.where("tourId", "==", tour_id)
        docs = query.stream()
        
        total_bookings = 0
        total_participants = 0
        dates_booked = set()
        
        for doc in docs:
            booking = doc.to_dict()
            total_bookings += 1
            total_participants += booking.get("numParticipants", 0)
            
            date_value = booking.get('bookingDate') or booking.get('dateString')
            if date_value:
                if isinstance(date_value, datetime):
                    dates_booked.add(format_date_string(date_value))
                elif isinstance(date_value, str) and len(date_value) >= 10:
                    dates_booked.add(date_value[:10])
        
        return {
            "tour_id": tour_id,
            "total_bookings": total_bookings,
            "total_participants": total_participants,
            "unique_dates_booked": len(dates_booked),
            "dates_booked": sorted(list(dates_booked))
        }
        
    except Exception as e:
        print(f"❌ Erro ao buscar estatísticas: {e}")
        return {
            "tour_id": tour_id,
            "total_bookings": 0,
            "total_participants": 0,
            "unique_dates_booked": 0,
            "dates_booked": [],
            "error": str(e)
        }
