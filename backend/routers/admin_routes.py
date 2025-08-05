from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, List
import smtplib
import os
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

# CORRIGIDO: Importações absolutas
from config.firestore_db import db as db_firestore
from utils.auth import verify_firebase_token
from models.booking import BookingStats

router = APIRouter(prefix="/api/admin", tags=["Admin & Debug"])

# ============================================================================
# 📧 ENDPOINTS DE EMAIL - Integração com AdminPanel Frontend
# ============================================================================

@router.post("/send-email")
async def send_booking_email(request: Request, user=Depends(verify_firebase_token)):
    """Enviar email personalizado para reserva - Usado pelo AdminPanel"""
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        data = await request.json()
        booking_id = data.get('booking_id')
        email_config = data.get('email_config')
        email_type = data.get('email_type', 'booking_confirmation')
        language = data.get('language', 'pt')
        
        print(f"📧 Enviando email tipo '{email_type}' para booking {booking_id}")
        print(f"🌍 Idioma: {language}")
        
        # Validações
        if not email_config or not email_config.get('to'):
            raise HTTPException(400, "Configuração de email inválida")
        
        # ✅ Configuração SMTP usando seu .env
        smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', 'geral@9rocks.pt')
        smtp_pass = os.getenv('SMTP_PASSWORD')  # kmer bekx mbbj uzdh
        from_name = os.getenv('SMTP_FROM_NAME', '9 Rocks Tours')
        
        # ✅ Emails específicos por idioma (usando seu .env)
        from_emails = {
            'pt': os.getenv('EMAIL_BOOKING_PT', 'reserva@9rocks.pt'),
            'en': os.getenv('EMAIL_BOOKING_EN', 'booking@9rocks.pt'),
            'es': os.getenv('EMAIL_BOOKING_ES', 'reservas@9rocks.pt')
        }
        
        if not smtp_pass:
            print("⚠️ Aviso: SMTP_PASSWORD não configurado. Simulando envio...")
            return {
                "success": True, 
                "message": f"Email simulado enviado para {email_config.get('to')}",
                "email_type": email_type,
                "language": language,
                "simulated": True
            }
        
        # ✅ Criar mensagem com email correto por idioma
        msg = MIMEMultipart('alternative')
        sender_email = from_emails.get(language, from_emails['pt'])
        msg['From'] = f"{from_name} <{sender_email}>"
        msg['To'] = email_config.get('to')
        msg['Subject'] = email_config.get('subject', get_default_subject(email_type, language))
        
        # ✅ Corpo do email personalizado
        html_body = generate_email_template(email_config, email_type, language)
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # ✅ Enviar email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        # ✅ Log no Firestore
        try:
            email_log = {
                "booking_id": booking_id,
                "email_type": email_type,
                "recipient": email_config.get('to'),
                "sender": sender_email,
                "language": language,
                "sent_at": datetime.utcnow().isoformat(),
                "sent_by": user.get('email', 'admin'),
                "status": "sent",
                "subject": msg['Subject']
            }
            db_firestore.collection('email_logs').add(email_log)
            print(f"📊 Log salvo no Firestore: {booking_id}")
        except Exception as log_error:
            print(f"⚠️ Erro ao salvar log: {log_error}")
        
        print(f"✅ Email '{email_type}' enviado de {sender_email} para {email_config.get('to')}")
        
        return {
            "success": True, 
            "message": f"Email enviado com sucesso para {email_config.get('to')}",
            "email_type": email_type,
            "language": language,
            "sender": sender_email,
            "booking_id": booking_id
        }
        
    except Exception as e:
        error_msg = f"Erro ao enviar email: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(500, error_msg)

@router.post("/schedule-booking-emails")
async def schedule_booking_emails(request: Request, user=Depends(verify_firebase_token)):
    """Agendar estratégia completa de emails para reserva"""
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        data = await request.json()
        booking_id = data.get('booking_id')
        confirmation_config = data.get('confirmation_config')
        language = data.get('language', 'pt')
        tour_date = data.get('tour_date')
        
        print(f"⚡ Agendando estratégia de emails para booking {booking_id}")
        
        # ✅ Usar configurações do .env
        confirmation_delay = int(os.getenv('EMAIL_CONFIRMATION_DELAY_MINUTES', '25'))
        reminder_hours = int(os.getenv('EMAIL_REMINDER_HOURS_BEFORE', '34'))
        
        # ✅ Calcular datas de agendamento
        now = datetime.utcnow()
        confirmation_time = now + timedelta(minutes=confirmation_delay)
        
        # Converter tour_date para datetime
        if isinstance(tour_date, str):
            tour_datetime = datetime.fromisoformat(tour_date.replace('Z', '+00:00'))
        else:
            tour_datetime = tour_date
            
        reminder_time = tour_datetime - timedelta(hours=reminder_hours)
        
        # ✅ Configuração para email de lembrete
        reminder_config = confirmation_config.copy()
        reminder_config.update({
            'subject': get_reminder_subject(language),
            'email_type': 'booking_reminder'
        })
        
        # ✅ Criar registos de emails agendados no Firestore
        scheduled_emails = [
            {
                "booking_id": booking_id,
                "email_type": "booking_confirmation",
                "scheduled_for": confirmation_time.isoformat(),
                "config": confirmation_config,
                "language": language,
                "status": "scheduled",
                "created_at": now.isoformat(),
                "created_by": user.get('email', 'admin'),
                "delay_minutes": confirmation_delay
            },
            {
                "booking_id": booking_id,
                "email_type": "booking_reminder", 
                "scheduled_for": reminder_time.isoformat(),
                "config": reminder_config,
                "language": language,
                "status": "scheduled",
                "created_at": now.isoformat(),
                "created_by": user.get('email', 'admin'),
                "hours_before": reminder_hours
            }
        ]
        
        # ✅ Salvar no Firestore
        for email_data in scheduled_emails:
            db_firestore.collection('scheduled_emails').add(email_data)
        
        print(f"✅ Estratégia agendada: {len(scheduled_emails)} emails")
        print(f"📧 Confirmação: {confirmation_time.strftime('%d/%m/%Y %H:%M')}")
        print(f"🎒 Lembrete: {reminder_time.strftime('%d/%m/%Y %H:%M')}")
        
        return {
            "success": True, 
            "message": "Estratégia de emails agendada com sucesso",
            "emails_scheduled": len(scheduled_emails),
            "confirmation_time": confirmation_time.isoformat(),
            "reminder_time": reminder_time.isoformat(),
            "settings": {
                "confirmation_delay_minutes": confirmation_delay,
                "reminder_hours_before": reminder_hours
            }
        }
        
    except Exception as e:
        error_msg = f"Erro ao agendar emails: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(500, error_msg)

def get_default_subject(email_type: str, language: str) -> str:
    """Assuntos padrão por tipo e idioma"""
    subjects = {
        'booking_confirmation': {
            'pt': '✅ Confirmação de Reserva - 9 Rocks Tours',
            'en': '✅ Booking Confirmation - 9 Rocks Tours', 
            'es': '✅ Confirmación de Reserva - 9 Rocks Tours'
        },
        'booking_reminder': {
            'pt': '🎒 Lembrete: O seu tour é amanhã! - 9 Rocks Tours',
            'en': '🎒 Reminder: Your tour is tomorrow! - 9 Rocks Tours',
            'es': '🎒 Recordatorio: ¡Su tour es mañana! - 9 Rocks Tours'
        }
    }
    
    return subjects.get(email_type, subjects['booking_confirmation']).get(language, subjects['booking_confirmation']['pt'])

def generate_email_template(email_config: dict, email_type: str, language: str) -> str:
    """Gerar template HTML responsivo personalizado"""
    
    # ✅ Templates responsivos com CSS inline
    templates = {
        'booking_confirmation': {
            'pt': """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmação de Reserva</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏔️ 9 Rocks Tours</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Obrigado pela sua reserva!</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>{customerName}</strong>,</p>
                        <p style="font-size: 16px; margin-bottom: 25px;">É com grande prazer que confirmamos a sua reserva connosco!</p>
                        
                        <!-- Highlight Box -->
                        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea;">
                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">📋 Detalhes da sua aventura:</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; width: 30%;">🎯 Tour:</td>
                                    <td style="padding: 8px 0;">{tourName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold;">📅 Data:</td>
                                    <td style="padding: 8px 0;">{tourDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold;">📧 Referência:</td>
                                    <td style="padding: 8px 0; font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; display: inline-block;">{bookingId}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="font-size: 16px; margin-bottom: 15px;">Estamos entusiasmados por partilhar esta experiência única consigo na bela <strong>Ilha da Madeira</strong>! 🌿</p>
                        <p style="font-size: 16px; margin-bottom: 30px;">Irá receber mais informações e dicas importantes próximo à data do tour.</p>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://9rocks.pt" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">🌐 Visite o nosso site</a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #667eea;">🌟 Equipa 9 Rocks Tours 🌟</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            Este email foi enviado automaticamente em {sentTime}<br>
                            📧 reserva@9rocks.pt | 📞 +351 963 366 458
                        </p>
                    </div>
                </div>
                
                <!-- Mobile Responsive -->
                <style>
                    @media only screen and (max-width: 600px) {{
                        .container {{ width: 100% !important; }}
                        .content {{ padding: 20px !important; }}
                    }}
                </style>
            </body>
            </html>
            """,
            'en': """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏔️ 9 Rocks Tours</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Thank you for your booking!</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>{customerName}</strong>,</p>
                        <p style="font-size: 16px; margin-bottom: 25px;">We're delighted to confirm your booking with us!</p>
                        
                        <!-- Highlight Box -->
                        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea;">
                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">📋 Your adventure details:</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; width: 30%;">🎯 Tour:</td>
                                    <td style="padding: 8px 0;">{tourName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold;">📅 Date:</td>
                                    <td style="padding: 8px 0;">{tourDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold;">📧 Reference:</td>
                                    <td style="padding: 8px 0; font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; display: inline-block;">{bookingId}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="font-size: 16px; margin-bottom: 15px;">We're excited to share this unique experience with you in beautiful <strong>Madeira Island</strong>! 🌿</p>
                        <p style="font-size: 16px; margin-bottom: 30px;">You'll receive more information and important tips closer to your tour date.</p>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://9rocks.pt" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">🌐 Visit our website</a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #667eea;">🌟 9 Rocks Tours Team 🌟</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            This email was sent automatically at {sentTime}<br>
                            📧 booking@9rocks.pt | 📞 +351 963 366 458
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
        },
        'booking_reminder': {
            'pt': """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lembrete do Tour</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎒 9 Rocks Tours</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">O seu tour é amanhã!</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>{customerName}</strong>,</p>
                        <p style="font-size: 18px; margin-bottom: 25px; color: #ff6b6b; font-weight: bold;">A sua aventura com a 9 Rocks Tours é <u>amanhã</u>! 🎉</p>
                        
                        <!-- Tour Info -->
                        <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ffc107;">
                            <h3 style="margin: 0 0 15px 0; color: #e67e22; font-size: 18px;">🕐 Lembrete:</h3>
                            <p style="font-size: 16px; margin: 0; font-weight: bold;">{tourName} - {tourDate}</p>
                        </div>
                        
                        <!-- Preparation Checklist -->
                        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border: 2px solid #e9ecef;">
                            <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 18px;">🎒 Lista de preparação:</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Calçado adequado para caminhada</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Roupa confortável (várias camadas)</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Protetor solar e chapéu</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Água (recomendamos 1.5L por pessoa)</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Máquina fotográfica 📸</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Lanche ligeiro</td></tr>
                                <tr><td style="padding: 5px 0; font-size: 15px;">✅ Espírito de aventura! 😊</td></tr>
                            </table>
                        </div>
                        
                        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; font-weight: bold; color: #2d3436;">
                            Estamos ansiosos por esta aventura convosco! 🏔️🌿
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #ff6b6b;">🌟 Equipa 9 Rocks Tours 🌟</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            Lembrete automático enviado em {sentTime}<br>
                            📧 reserva@9rocks.pt | 📞 +351 963 366 458
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
        }
    }
    
    # ✅ Selecionar template
    template = templates.get(email_type, templates['booking_confirmation']).get(language, templates['booking_confirmation']['pt'])
    
    # ✅ Dados dinâmicos da reserva
    template_data = {
        'customerName': email_config.get('customerName', 'Cliente'),
        'tourName': email_config.get('tourName', 'Tour na Madeira'),
        'tourDate': email_config.get('tourDate', 'Data a confirmar'),
        'bookingId': email_config.get('bookingId', 'N/A'),
        'sentTime': datetime.utcnow().strftime('%d/%m/%Y às %H:%M UTC')
    }
    
    # ✅ Substituir placeholders pelos dados reais
    return template.format(**template_data)

def get_reminder_subject(language: str) -> str:
    """Assunto do email de lembrete por idioma"""
    return get_default_subject('booking_reminder', language)

# ============================================================================
# 📊 ENDPOINTS EXISTENTES (mantidos)
# ============================================================================

@router.get("/debug/email-config")
async def debug_email_config():
    """Debug da configuração de email"""
    return {
        "smtp_host": os.getenv('SMTP_HOST'),
        "smtp_port": os.getenv('SMTP_PORT'),
        "smtp_user": os.getenv('SMTP_USER'),
        "smtp_configured": bool(os.getenv('SMTP_PASSWORD')),
        "from_name": os.getenv('SMTP_FROM_NAME'),
        "emails": {
            "booking_pt": os.getenv('EMAIL_BOOKING_PT'),
            "booking_en": os.getenv('EMAIL_BOOKING_EN'),
            "booking_es": os.getenv('EMAIL_BOOKING_ES'),
        },
        "settings": {
            "confirmation_delay": os.getenv('EMAIL_CONFIRMATION_DELAY_MINUTES'),
            "reminder_hours_before": os.getenv('EMAIL_REMINDER_HOURS_BEFORE'),
        }
    }

@router.get("/debug/payment-methods")
async def debug_payment_methods():
    try:
        debug_info = {
            "timestamp": datetime.utcnow().isoformat(),
            "smtp_configured": bool(os.getenv('SMTP_PASSWORD')),
            "email_system": "operational"
        }
        return debug_info
    except Exception as e:
        return {"error": "Erro no debug", "message": str(e)}

@router.post("/sync-occupied-dates")
async def sync_occupied_dates(user=Depends(verify_firebase_token)):
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        sync_results = []
        return {"success": True, "results": sync_results}
    except Exception as e:
        raise HTTPException(500, str(e))

# Substitua a função get_booking_stats (linha 487-499) por esta:

@router.get("/stats")
async def get_booking_stats(user=Depends(verify_firebase_token)):
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        print("📊 Calculando estatísticas reais do Firestore...")
        
        # ✅ Buscar dados reais do Firestore
        bookings_ref = db_firestore.collection('bookings')
        payments_ref = db_firestore.collection('payments')
        tours_ref = db_firestore.collection('tours')
        
        # Obter todos os documentos
        bookings_docs = bookings_ref.get()
        payments_docs = payments_ref.get()
        tours_docs = tours_ref.get()
        
        # Converter para listas
        bookings = [doc.to_dict() for doc in bookings_docs]
        payments = [doc.to_dict() for doc in payments_docs]
        tours = [doc.to_dict() for doc in tours_docs]
        
        # ✅ Calcular estatísticas reais
        total_bookings = len(bookings)
        
        # Receita total de pagamentos completados
        completed_payments = [p for p in payments if p.get('status') in ['completed', 'succeeded']]
        total_revenue = sum([float(p.get('amount', 0)) for p in completed_payments])
        
        # Reservas pendentes
        pending_bookings = len([b for b in bookings if b.get('status') == 'pending'])
        
        # Reservas por tour
        bookings_by_tour = {}
        for booking in bookings:
            tour_id = booking.get('tour_id')
            if tour_id:
                bookings_by_tour[tour_id] = bookings_by_tour.get(tour_id, 0) + 1
        
        # Reservas por data (últimos 30 dias)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        bookings_by_date = {}
        
        for booking in bookings:
            created_at = booking.get('created_at')
            if created_at:
                # Converter string para datetime se necessário
                if isinstance(created_at, str):
                    try:
                        booking_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    except:
                        continue
                else:
                    booking_date = created_at
                
                if booking_date >= thirty_days_ago:
                    date_str = booking_date.strftime('%Y-%m-%d')
                    bookings_by_date[date_str] = bookings_by_date.get(date_str, 0) + 1
        
        # Reservas por status
        bookings_by_status = {}
        for booking in bookings:
            status = booking.get('status', 'unknown')
            bookings_by_status[status] = bookings_by_status.get(status, 0) + 1
        
        # ✅ Criar objeto de resposta real
        real_stats = {
            "total_bookings": total_bookings,
            "total_revenue": round(total_revenue, 2),
            "pending_bookings": pending_bookings,
            "active_tours": len(tours),
            "bookings_by_tour": bookings_by_tour,
            "bookings_by_date": bookings_by_date,
            "bookings_by_status": bookings_by_status,
            "last_updated": datetime.utcnow().isoformat(),
            
            # ✅ Métricas adicionais
            "completed_bookings": len([b for b in bookings if b.get('status') == 'confirmed']),
            "cancelled_bookings": len([b for b in bookings if b.get('status') == 'cancelled']),
            "total_payments": len(payments),
            "average_booking_value": round(total_revenue / max(total_bookings, 1), 2),
            "conversion_rate": round(len(completed_payments) / max(total_bookings, 1) * 100, 1)
        }
        
        print(f"✅ Stats calculadas: {total_bookings} reservas, €{total_revenue} receita")
        return real_stats
        
    except Exception as e:
        error_msg = f"Erro ao calcular estatísticas: {str(e)}"
        print(f"❌ {error_msg}")
        
        # ✅ Fallback para stats mock em caso de erro
        mock_stats = {
            "total_bookings": 0,
            "total_revenue": 0.0,
            "pending_bookings": 0,
            "active_tours": 0,
            "bookings_by_tour": {},
            "bookings_by_date": {},
            "bookings_by_status": {},
            "error": error_msg,
            "fallback": True
        }
        return mock_stats

# ✅ Adicionar endpoint para estatísticas avançadas
@router.get("/advanced-stats")
async def get_advanced_stats(period: str = "last_6_months", user=Depends(verify_firebase_token)):
    if not user:
        raise HTTPException(401, "Autenticação necessária")
    
    try:
        print(f"📈 Calculando estatísticas avançadas para período: {period}")
        
        # Definir período de análise
        now = datetime.utcnow()
        if period == "last_30_days":
            start_date = now - timedelta(days=30)
        elif period == "last_6_months":
            start_date = now - timedelta(days=180)
        elif period == "this_year":
            start_date = datetime(now.year, 1, 1)
        else:
            start_date = now - timedelta(days=180)
        
        # Buscar dados do período
        bookings_ref = db_firestore.collection('bookings')
        bookings_docs = bookings_ref.where('created_at', '>=', start_date.isoformat()).get()
        bookings = [doc.to_dict() for doc in bookings_docs]
        
        payments_ref = db_firestore.collection('payments')
        payments_docs = payments_ref.where('created_at', '>=', start_date.isoformat()).get()
        payments = [doc.to_dict() for doc in payments_docs]
        
        # Buscar logs de email
        email_logs_ref = db_firestore.collection('email_logs')
        email_docs = email_logs_ref.where('sent_at', '>=', start_date.isoformat()).get()
        email_logs = [doc.to_dict() for doc in email_docs]
        
        # ✅ Calcular métricas avançadas
        # Reservas por mês
        bookings_by_month = {}
        revenue_by_month = {}
        
        for booking in bookings:
            created_at = booking.get('created_at')
            if created_at:
                try:
                    booking_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    month_key = booking_date.strftime('%Y-%m')
                    bookings_by_month[month_key] = bookings_by_month.get(month_key, 0) + 1
                except:
                    continue
        
        for payment in payments:
            if payment.get('status') in ['completed', 'succeeded']:
                created_at = payment.get('created_at')
                amount = float(payment.get('amount', 0))
                if created_at:
                    try:
                        payment_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        month_key = payment_date.strftime('%Y-%m')
                        revenue_by_month[month_key] = revenue_by_month.get(month_key, 0) + amount
                    except:
                        continue
        
        # Performance de tours
        tour_performance = {}
        for booking in bookings:
            tour_id = booking.get('tour_id')
            if tour_id:
                if tour_id not in tour_performance:
                    tour_performance[tour_id] = {'bookings': 0, 'revenue': 0}
                tour_performance[tour_id]['bookings'] += 1
                
                # Encontrar pagamento correspondente
                booking_amount = booking.get('total_amount', 0)
                tour_performance[tour_id]['revenue'] += float(booking_amount)
        
        # Demografia
        demographics = {
            'languages': {},
            'avg_group_size': 0,
            'total_participants': 0
        }
        
        total_participants = 0
        for booking in bookings:
            # Idioma
            lang = booking.get('language', 'pt')
            demographics['languages'][lang] = demographics['languages'].get(lang, 0) + 1
            
            # Participantes
            participants = booking.get('participants', 1)
            total_participants += participants
        
        demographics['avg_group_size'] = round(total_participants / max(len(bookings), 1), 1)
        demographics['total_participants'] = total_participants
        
        # Estatísticas de email
        email_stats = {
            'total_sent': len(email_logs),
            'by_type': {},
            'by_language': {}
        }
        
        for email in email_logs:
            email_type = email.get('email_type', 'unknown')
            language = email.get('language', 'pt')
            
            email_stats['by_type'][email_type] = email_stats['by_type'].get(email_type, 0) + 1
            email_stats['by_language'][language] = email_stats['by_language'].get(language, 0) + 1
        
        # ✅ Resposta completa
        advanced_stats = {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat(),
            "total_bookings": len(bookings),
            "total_revenue": sum(revenue_by_month.values()),
            "bookings_by_month": bookings_by_month,
            "revenue_by_month": revenue_by_month,
            "tour_performance": tour_performance,
            "demographics": demographics,
            "email_stats": email_stats,
            "conversion_metrics": {
                "booking_to_payment": round(len(payments) / max(len(bookings), 1) * 100, 1),
                "avg_booking_value": round(sum(revenue_by_month.values()) / max(len(bookings), 1), 2)
            },
            "calculated_at": now.isoformat()
        }
        
        print(f"✅ Stats avançadas calculadas para {len(bookings)} reservas")
        return advanced_stats
        
    except Exception as e:
        error_msg = f"Erro ao calcular estatísticas avançadas: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(500, error_msg)