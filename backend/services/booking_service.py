from config.firestore_db import db as db_firestore
from datetime import datetime
from models.booking import BookingCreate, Booking
from typing import Dict
import uuid # Adicionado uuid
from fastapi import HTTPException


def create_booking(booking_data: BookingCreate) -> Dict:
    try:
        tour_doc = db_firestore.collection('tours').document(booking_data.tour_id).get()
        if not tour_doc.exists:
            raise ValueError("Tour não encontrado")
        
        tour = tour_doc.to_dict()
        total_amount = tour["price"] * booking_data.participants
        
        booking_id = str(uuid.uuid4())
        booking_dict = {
            "id": booking_id,
            "tour_id": booking_data.tour_id,
            "customer_name": booking_data.customer_name,
            "customer_email": booking_data.customer_email,
            "customer_phone": booking_data.customer_phone,
            "selected_date": booking_data.selected_date,
            "participants": booking_data.participants,
            "total_amount": total_amount,
            "special_requests": booking_data.special_requests,
            "payment_method": booking_data.payment_method,
            "status": "pending",
            "payment_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db_firestore.collection('bookings').document(booking_id).set(booking_dict)
        return booking_dict
    except Exception as e:
        raise ValueError(str(e))

def handle_successful_payment(booking_id: str, tour_id: str, selected_date: str) -> bool:
    try:
        tour_ref = db_firestore.collection('tours').document(tour_id)
        tour_doc = tour_ref.get()
        
        if not tour_doc.exists:
            return False
        
        tour_data = tour_doc.to_dict()
        occupied_dates = tour_data.get('occupied_dates', [])
        
        if selected_date not in occupied_dates:
            occupied_dates.append(selected_date)
            tour_ref.update({
                'occupied_dates': occupied_dates,
                'updated_at': datetime.utcnow()
            })
        
        # Atualizar booking
        booking_ref = db_firestore.collection('bookings').document(booking_id)
        booking_ref.update({
            'payment_status': "paid",
            'status': "confirmed",
            'updated_at': datetime.utcnow()
        })
        
        return True
    except Exception as e:
        print(f"Erro ao handle payment: {e}")
        return False