from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
# CORRIGIDO: Importações absolutas
from config.firestore_db import db as db_firestore
from utils.auth import verify_firebase_token
from models.booking import BookingStats  # Importa BookingStats do módulo de modelos
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["Admin & Debug"])

# Debug Payment Methods
@router.get("/debug/payment-methods")
async def debug_payment_methods():
    try:
        # Lógica de debug para pagamentos (do server.py)
        debug_info = {
            "timestamp": datetime.utcnow().isoformat(),
            # ... (adapte com testes de paypal/stripe)
        }
        return debug_info
    except Exception as e:
        return {"error": "Erro no debug", "message": str(e)}

# Sync Occupied Dates (com auth)
@router.post("/sync-occupied-dates")
async def sync_occupied_dates(user=Depends(verify_firebase_token)):
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        # Lógica completa de sync do server.py
        sync_results = []  # Processa tours e bookings
        # ... (copia do server.py para sync)
        
        return {"success": True, "results": sync_results}
    except Exception as e:
        raise HTTPException(500, str(e))

# Outros admin endpoints (ex.: stats, export bookings)
@router.get("/stats")
async def get_booking_stats(user=Depends(verify_firebase_token)):
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    # Lógica para stats (ex.: count bookings, revenue)
    # Exemplo de retorno de BookingStats (assumindo que você tem os dados para preencher)
    # Para um exemplo real, você buscaria os dados do Firestore e os agregaria.
    mock_stats = BookingStats(
        total_bookings=100,
        total_revenue=5000.00,
        bookings_by_tour={"tour_a": 50, "tour_b": 30, "tour_c": 20},
        bookings_by_date={"2024-07-01": 10, "2024-07-02": 15},
        bookings_by_status={"confirmed": 80, "pending": 15, "cancelled": 5}
    )
    return mock_stats
