# backend/services/tour_service.py
from ..config.firestore_db import db as db_firestore
from datetime import datetime, timedelta
from typing import List, Dict

def get_tour_occupied_dates(tour_id: str) -> Dict:
    try:
        tour_ref = db_firestore.collection('tours').document(tour_id)
        tour_doc = tour_ref.get()
        
        if not tour_doc.exists:
            raise ValueError("Tour não encontrado")
        
        tour_data = tour_doc.to_dict()
        occupied_dates = tour_data.get('occupied_dates', [])
        
        return {
            "success": True,
            "tour_id": tour_id,
            "occupied_dates": occupied_dates,
            "total_occupied": len(occupied_dates),
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise ValueError(str(e))

# Adição: Get available dates (integra com Google Calendar se disponível)
def get_available_dates(tour_id: str, start_date: str, end_date: str) -> List[str]:
    try:
        from utils.google_calendar import get_calendar_availability  # Assumindo que tens utils/google_calendar.py
        
        tour_ref = db_firestore.collection('tours').document(tour_id)
        tour_doc = tour_ref.get()
        
        if not tour_doc.exists:
            raise ValueError("Tour não encontrado")
        
        tour_data = tour_doc.to_dict()
        specific_dates = tour_data.get('available_dates', [])  # Do modelo tour
        
        if specific_dates:
            return [d for d in specific_dates if start_date <= d <= end_date]
        else:
            # Fallback para Google Calendar
            return get_calendar_availability(start_date, end_date)
    except Exception as e:
        # Fallback simples se erro
        start = datetime.fromisoformat(start_date)
        available = []
        for i in range(30):
            date = start + timedelta(days=i)
            if date.weekday() < 5:  # Dias úteis
                available.append(date.strftime("%Y-%m-%d"))
        return available

def release_occupied_date(tour_id: str, date: str) -> Dict:
    try:
        tour_ref = db_firestore.collection('tours').document(tour_id)
        tour_doc = tour_ref.get()
        
        if not tour_doc.exists:
            raise ValueError("Tour não encontrado")
        
        tour_data = tour_doc.to_dict()
        occupied_dates = tour_data.get('occupied_dates', [])
        
        if date in occupied_dates:
            occupied_dates.remove(date)
            tour_ref.update({
                'occupied_dates': occupied_dates,
                'updated_at': datetime.utcnow()
            })
            return {"success": True, "message": f"Data {date} liberada"}
        else:
            return {"success": False, "message": f"Data {date} não estava ocupada"}
    except Exception as e:
        raise ValueError(str(e))

def sync_occupied_dates() -> Dict:
    try:
        tours = db_firestore.collection('tours').stream()
        sync_results = []
        
        for tour_doc in tours:
            tour_id = tour_doc.id
            tour_data = tour_doc.to_dict()
            
            bookings = db_firestore.collection('bookings').where('tour_id', '==', tour_id).where('status', '==', 'confirmed').stream()
            
            occupied_dates = []
            for booking in bookings:
                booking_data = booking.to_dict()
                selected_date = booking_data.get('selected_date')
                if selected_date and selected_date not in occupied_dates:
                    occupied_dates.append(selected_date)
            
            if occupied_dates:
                tour_doc.reference.update({
                    'occupied_dates': occupied_dates,
                    'updated_at': datetime.utcnow()
                })
            
            sync_results.append({
                "tour_id": tour_id,
                "occupied_dates": occupied_dates
            })
        
        return {"success": True, "results": sync_results}
    except Exception as e:
        raise ValueError(str(e))