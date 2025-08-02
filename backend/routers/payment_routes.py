# backend/routers/payment_routes.py - VERSÃO FINAL E COMPLETA
import os # 
from fastapi import APIRouter, HTTPException, Request, Response, Query
from typing import Dict
from models.payment import CreatePaymentIntentRequest
from services.stripe_service import stripe_service
from services.booking_service import handle_successful_payment
from config.firestore_db import db as db_firestore
from datetime import datetime
import json
import uuid
import traceback

# O serviço PayPal é importado. Garanta que 'paypalrestsdk' está no seu requirements.txt
try:
    from services.paypal_service import paypal_service
except ImportError:
    paypal_service = None
    print("⚠️ PayPal service não disponível, verifique a instalação do paypalrestsdk.")

router = APIRouter(tags=["Payments"])

# ===================================================================
# ## SECÇÃO BOOKING (SUA LÓGICA ORIGINAL MANTIDA) ##
# ===================================================================
@router.post("/create-booking")
async def create_booking_endpoint(request: Dict):
    """Endpoint para criar booking e iniciar processo de pagamento"""
    try:
        booking_data = {
            "tour_id": request.get("tour_id"),
            "customer_name": f"{request.get('firstName', '')} {request.get('lastName', '')}",
            "customer_email": request.get("email"),
            "customer_phone": request.get("phone"),
            "participants": request.get("numberOfPeople", 1),
            "selected_date": request.get("selectedDate"),
            "special_requests": request.get("specialRequests", ""),
            "status": "pending",
            "payment_status": "pending",
            "created_at": datetime.utcnow()
        }

        booking_ref = db_firestore.collection('bookings').add(booking_data)
        booking_id = booking_ref[1].id

        return Response(
            status_code=201,
            content=json.dumps({
                "success": True,
                "bookingId": booking_id,
                "message": "Booking criado com sucesso"
            }),
            media_type="application/json"
        )

    except Exception as e:
        print(f"❌ Erro ao criar booking: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ===================================================================
# ## SECÇÃO STRIPE (SUA LÓGICA ORIGINAL MANTIDA) ##
# ===================================================================
@router.get("/stripe/config")
async def get_stripe_config():
    if not stripe_service or not stripe_service.available:
        raise HTTPException(status_code=503, detail="Stripe não configurado")

    return {
        "available": True,
        "publishable_key": stripe_service.get_publishable_key(),
        "merchant_id": stripe_service.merchant_id,
        "environment": stripe_service.google_pay_environment
    }

@router.post("/create-intent")
async def create_stripe_intent(request: CreatePaymentIntentRequest):
    if not stripe_service:
        raise HTTPException(status_code=503, detail="Stripe não disponível")

    try:
        print(f"🔍 DEBUG: Recebido request para criar Payment Intent: {request.dict()}")

        booking_doc = db_firestore.collection('bookings').document(request.booking_id).get()
        if not booking_doc.exists:
            raise HTTPException(status_code=404, detail="Reserva não encontrada para iniciar o pagamento.")

        booking_data = booking_doc.to_dict()
        print(f"✅ DEBUG: Booking encontrado: {request.booking_id}")

        tour_doc = db_firestore.collection('tours').document(request.tour_id).get()
        if not tour_doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado.")

        tour_data = tour_doc.to_dict()

        stripe_payment_data = {
            "amount": request.amount,
            "tour_id": request.tour_id,
            "booking_id": request.booking_id,
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "tour_name": tour_data.get("name", {}).get("pt", "Tour Portugal"),
            "participants": booking_data.get("participants", 1)
        }

        print(f"🔍 DEBUG: Chamando stripe_service.create_payment_intent...")
        intent_result = stripe_service.create_payment_intent(stripe_payment_data)
        print(f"🔍 DEBUG: Resultado do stripe_service: {intent_result}")

        payment_intent_id = intent_result.get("payment_intent_id")
        client_secret = intent_result.get("client_secret")

        if not payment_intent_id or not client_secret:
            raise HTTPException(status_code=500, detail="Erro ao criar Payment Intent - dados incompletos")

        transaction_id = str(uuid.uuid4())
        transaction_data = {
            "transaction_id": transaction_id,
            "payment_method": "stripe",
            "payment_intent_id": payment_intent_id,
            "booking_id": request.booking_id,
            "tour_id": request.tour_id,
            "amount": request.amount,
            "currency": "EUR",
            "status": intent_result.get("status", "created"),
            "created_at": datetime.utcnow(),
            "customer_email": request.customer_email,
            "customer_name": request.customer_name
        }

        print(f"🔍 DEBUG: Criando transação no Firestore: {transaction_id}")
        db_firestore.collection('payment_transactions').document(transaction_id).set(transaction_data)

        response_data = {
            "success": True,
            "payment_intent_id": payment_intent_id,
            "client_secret": client_secret,
            "status": intent_result.get("status", "created"),
            "amount": request.amount,
            "currency": "EUR"
        }

        print(f"✅ DEBUG: Payment Intent {payment_intent_id} criado com sucesso!")
        return response_data

    except HTTPException as e:
        print(f"❌ DEBUG: HTTPException em create_stripe_intent: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ DEBUG: Erro inesperado em create_stripe_intent: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    try:
        if not stripe_service:
            raise HTTPException(status_code=503, detail="Stripe não disponível")

        body = await request.body()
        signature = request.headers.get("stripe-signature")

        try:
            webhook_data = stripe_service.handle_webhook(body, signature)
            print(f"🔔 DEBUG: Webhook Stripe recebido: {webhook_data.get('type')}")

            if webhook_data.get("type") == "payment_intent.succeeded":
                payment_intent = webhook_data.get("data", {}).get("object", {})
                payment_intent_id = payment_intent.get("id")

                if payment_intent_id:
                    transaction_docs = db_firestore.collection('payment_transactions').where('payment_intent_id', '==', payment_intent_id).stream()
                    transaction_doc = next(transaction_docs, None)

                    if transaction_doc:
                        transaction_data = transaction_doc.to_dict()

                        booking_id = transaction_data.get("booking_id")
                        tour_id = transaction_data.get("tour_id")
                        if booking_id and tour_id:
                            booking_ref = db_firestore.collection('bookings').document(booking_id)
                            booking_doc = booking_ref.get()
                            if booking_doc.exists:
                                booking_data = booking_doc.to_dict()
                                selected_date = booking_data.get('selected_date')
                                if selected_date:
                                    handle_successful_payment(booking_id, tour_id, selected_date)
                                    
                        # Adicionar um finally para garantir o update
                        transaction_doc.reference.update({
                            "status": "completed",
                            "webhook_received_at": datetime.utcnow()
                        })

        except Exception as e:
            print(f"❌ DEBUG: Erro no webhook: {str(e)}")
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"Erro no webhook: {str(e)}")

        return {"status": "webhook_processed"}
    except Exception as e:
        print(f"❌ DEBUG: Erro inesperado no webhook: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# ## SECÇÃO PAYPAL (REATIVADA E COMPLETA) ##
# ===================================================================

@router.get("/paypal/config")
async def get_paypal_config():
    """Verifica se o PayPal está configurado e disponível."""
    if not paypal_service or not paypal_service.available:
        return {"available": False, "message": "PayPal não está configurado no servidor."}
    return {"available": True, "client_id": paypal_service.client_id, "mode": paypal_service.mode}

@router.post("/paypal/create")
async def create_paypal_payment(request_data: Dict):
    """Cria um pagamento PayPal e retorna o URL de aprovação."""
    if not paypal_service or not paypal_service.available:
        raise HTTPException(status_code=503, detail="Serviço PayPal não disponível.")

    try:
        # Extrair dados do booking para passar ao PayPal
        booking_id = request_data.get("booking_id")
        booking_doc = db_firestore.collection('bookings').document(booking_id).get()
        if not booking_doc.exists:
            raise HTTPException(status_code=404, detail="Reserva associada não encontrada.")
        
        booking_data = booking_doc.to_dict()
        tour_id = booking_data.get("tour_id")
        tour_doc = db_firestore.collection('tours').document(tour_id).get()
        if not tour_doc.exists:
            raise HTTPException(status_code=404, detail="Tour associado não encontrado.")
        tour_data = tour_doc.to_dict()

        payment_data = {
            "amount": request_data.get("amount"),
            "tour_name": tour_data.get("name", {}).get("pt", "Reserva de Tour"),
            "tour_id": tour_id,
            "booking_id": booking_id,
            "participants": booking_data.get("participants", 1),
            "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment/success?method=paypal&booking_id={booking_id}",
            "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reservar/{tour_id}",
        }

        result = paypal_service.create_payment(payment_data)
        if result.get("status") == "created":
            return {"approval_url": result.get("approval_url")}
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Erro ao criar pagamento PayPal."))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/paypal/execute")
async def execute_paypal_payment(request: Request):
    """Executa o pagamento após aprovação do cliente no PayPal."""
    if not paypal_service or not paypal_service.available:
        raise HTTPException(status_code=503, detail="Serviço PayPal não disponível.")
    
    try:
        data = await request.json()
        payment_id = data.get("paymentId")
        payer_id = data.get("payerId")
        booking_id = data.get("bookingId") # Receber o bookingId do frontend

        if not all([payment_id, payer_id, booking_id]):
            raise HTTPException(status_code=400, detail="Dados para execução do pagamento incompletos.")

        result = paypal_service.execute_payment(payment_id=payment_id, payer_id=payer_id)
        
        if result.get("status") == "completed":
            booking_doc = db_firestore.collection('bookings').document(booking_id).get()
            if booking_doc.exists:
                booking_data = booking_doc.to_dict()
                handle_successful_payment(
                    booking_id=booking_id,
                    tour_id=booking_data.get("tour_id"),
                    selected_date=booking_data.get("selected_date")
                )

            return {"status": "success", "transaction_id": result.get("transaction_id")}
        else:
            raise HTTPException(status_code=400, detail=result.get("message", "Falha ao executar pagamento PayPal."))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))