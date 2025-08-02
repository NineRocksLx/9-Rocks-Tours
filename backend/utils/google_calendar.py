import os
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)

# Configuração
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), '..', 'google-calendar-key.json')
CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')

def get_calendar_service():
    """Cria e retorna o serviço do Google Calendar"""
    try:
        if os.path.exists(SERVICE_ACCOUNT_FILE):
            # Usar Service Account (produção)
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            service = build('calendar', 'v3', credentials=credentials)
        else:
            # Usar API Key (desenvolvimento)
            API_KEY = os.environ.get('GOOGLE_CALENDAR_ID')
            service = build('calendar', 'v3', developerKey=API_KEY)
        
        return service
    except Exception as e:
        logger.error(f"Erro ao criar serviço do Calendar: {e}")
        return None

def get_busy_slots(start_date: str, end_date: str):
    """Obtém os horários ocupados do calendário"""
    service = get_calendar_service()
    if not service:
        return []
    
    try:
        # Converter datas para formato RFC3339
        start_datetime = f"{start_date}T00:00:00Z"
        end_datetime = f"{end_date}T23:59:59Z"
        
        # Buscar eventos
        events_result = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=start_datetime,
            timeMax=end_datetime,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        busy_slots = []
        
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            # Converter para datetime
            if 'T' in start:  # É um evento com hora
                start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
            else:  # É um evento de dia inteiro
                start_dt = datetime.fromisoformat(start)
                end_dt = datetime.fromisoformat(end)
            
            busy_slots.append({
                'start': start_dt,
                'end': end_dt,
                'summary': event.get('summary', 'Ocupado')
            })
        
        return busy_slots
        
    except HttpError as error:
        logger.error(f'Erro ao buscar eventos: {error}')
        return []

def get_available_dates_for_tour(tour_id: str, tour_schedule: dict, start_date: str, end_date: str):
    """
    Retorna as datas disponíveis para um tour baseado no horário do tour e calendário
    
    Args:
        tour_id: ID do tour
        tour_schedule: Dict com os horários por dia da semana
            {
                'monday': {'active': True, 'start': '09:00', 'end': '13:00'},
                'tuesday': {'active': False},
                ...
            }
        start_date: Data inicial (YYYY-MM-DD)
        end_date: Data final (YYYY-MM-DD)
    """
    available_dates = []
    
    # Obter slots ocupados do calendário
    busy_slots = get_busy_slots(start_date, end_date)
    
    # Converter para um dict para busca rápida
    busy_dict = {}
    for slot in busy_slots:
        date_key = slot['start'].strftime('%Y-%m-%d')
        if date_key not in busy_dict:
            busy_dict[date_key] = []
        busy_dict[date_key].append(slot)
    
    # Iterar por cada dia no período
    current_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    
    weekday_map = {
        0: 'monday', 1: 'tuesday', 2: 'wednesday', 
        3: 'thursday', 4: 'friday', 5: 'saturday', 6: 'sunday'
    }
    
    while current_date <= end_dt:
        date_str = current_date.strftime('%Y-%m-%d')
        weekday = weekday_map[current_date.weekday()]
        
        # Verificar se o tour opera neste dia da semana
        if tour_schedule.get(weekday, {}).get('active', False):
            tour_start = tour_schedule[weekday]['start']
            tour_end = tour_schedule[weekday]['end']
            
            # Criar datetime para o horário do tour
            tour_start_dt = datetime.strptime(f"{date_str} {tour_start}", '%Y-%m-%d %H:%M')
            tour_end_dt = datetime.strptime(f"{date_str} {tour_end}", '%Y-%m-%d %H:%M')
            
            # Verificar se há conflito com eventos do calendário
            is_available = True
            if date_str in busy_dict:
                for busy_slot in busy_dict[date_str]:
                    # Verificar sobreposição
                    if not (tour_end_dt <= busy_slot['start'] or tour_start_dt >= busy_slot['end']):
                        is_available = False
                        break
            
            if is_available:
                available_dates.append({
                    'date': date_str,
                    'start_time': tour_start,
                    'end_time': tour_end
                })
        
        current_date += timedelta(days=1)
    
    return available_dates

def check_specific_datetime_availability(date_str: str, start_time: str, end_time: str):
    """Verifica se um horário específico está disponível"""
    start_dt = datetime.strptime(f"{date_str} {start_time}", '%Y-%m-%d %H:%M')
    end_dt = datetime.strptime(f"{date_str} {end_time}", '%Y-%m-%d %H:%M')
    
    # Buscar eventos do dia
    busy_slots = get_busy_slots(date_str, date_str)
    
    # Verificar conflitos
    for slot in busy_slots:
        if not (end_dt <= slot['start'] or start_dt >= slot['end']):
            return False, f"Conflito com: {slot['summary']}"
    
    return True, "Horário disponível"