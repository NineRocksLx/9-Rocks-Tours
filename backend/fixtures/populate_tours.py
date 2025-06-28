import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

tours_data = [
    {
        "id": str(uuid.uuid4()),
        "name": {
            "pt": "Lisboa Clássica",
            "en": "Classic Lisbon",
            "es": "Lisboa Clásica"
        },
        "short_description": {
            "pt": "Passeio pelo centro histórico de Lisboa",
            "en": "Tour through Lisbon's historic center",
            "es": "Recorrido por el centro histórico de Lisboa"
        },
        "description": {
            "pt": "Uma visita guiada pelo coração histórico de Lisboa.",
            "en": "A guided tour through the historical heart of Lisbon.",
            "es": "Una visita guiada por el corazón histórico de Lisboa."
        },
        "location": "Lisboa",
        "duration_hours": 4,
        "max_participants": 15,
        "tour_type": "cultural",
        "route_description": {
            "pt": "Baixa, Alfama, Chiado",
            "en": "Downtown, Alfama, Chiado",
            "es": "Baixa, Alfama, Chiado"
        },
        "includes": {
            "pt": "Guia profissional, entrada em monumentos, água",
            "en": "Professional guide, monument entrances, water",
            "es": "Guía profesional, entradas a monumentos, agua"
        },
        "excludes": {
            "pt": "Almoço, transporte até ao ponto de encontro",
            "en": "Lunch, transport to meeting point",
            "es": "Almuerzo, transporte al punto de encuentro"
        },
        "price": 49.99,
        "active": True,
        "images": [],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") 
            for i in range(1, 30) if (datetime.now() + timedelta(days=i)).weekday() < 5
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": {
            "pt": "Sintra Encantada",
            "en": "Enchanted Sintra",
            "es": "Sintra Encantada"
        },
        "short_description": {
            "pt": "Explore os palácios e florestas de Sintra",
            "en": "Explore Sintra's palaces and forests",
            "es": "Explora los palacios y bosques de Sintra"
        },
        "description": {
            "pt": "Explore os palácios e florestas místicas de Sintra.",
            "en": "Explore Sintra's palaces and mystical forests.",
            "es": "Explora los palacios y bosques místicos de Sintra."
        },
        "location": "Sintra",
        "duration_hours": 5,
        "max_participants": 12,
        "tour_type": "cultural",
        "route_description": {
            "pt": "Palácio da Pena, Quinta da Regaleira, Centro Histórico",
            "en": "Pena Palace, Quinta da Regaleira, Historic Center",
            "es": "Palacio da Pena, Quinta da Regaleira, Centro Histórico"
        },
        "includes": {
            "pt": "Guia especializado, bilhetes de entrada",
            "en": "Expert guide, entrance tickets",
            "es": "Guía experto, entradas"
        },
        "excludes": {
            "pt": "Almoço, transporte",
            "en": "Lunch, transportation",
            "es": "Almuerzo, transporte"
        },
        "price": 59.99,
        "active": True,
        "images": [],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") 
            for i in range(1, 30) if (datetime.now() + timedelta(days=i)).weekday() < 5
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": {
            "pt": "Fátima Espiritual",
            "en": "Spiritual Fatima",
            "es": "Fátima Espiritual"
        },
        "short_description": {
            "pt": "Visite o Santuário de Fátima e arredores",
            "en": "Visit the Sanctuary of Fatima and surroundings",
            "es": "Visita el Santuario de Fátima y alrededores"
        },
        "description": {
            "pt": "Visite o Santuário de Fátima e arredores.",
            "en": "Visit the Sanctuary of Fatima and its surroundings.",
            "es": "Visita el Santuario de Fátima y sus alrededores."
        },
        "location": "Fátima",
        "duration_hours": 3,
        "max_participants": 20,
        "tour_type": "cultural",
        "route_description": {
            "pt": "Santuário de Fátima, Capelinha das Aparições",
            "en": "Sanctuary of Fatima, Chapel of Apparitions",
            "es": "Santuario de Fátima, Capilla de las Apariciones"
        },
        "includes": {
            "pt": "Guia especializado em história religiosa",
            "en": "Guide specialized in religious history",
            "es": "Guía especializado en historia religiosa"
        },
        "excludes": {
            "pt": "Transporte, refeições",
            "en": "Transportation, meals",
            "es": "Transporte, comidas"
        },
        "price": 39.99,
        "active": True,
        "images": [],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") 
            for i in range(1, 30) if (datetime.now() + timedelta(days=i)).weekday() < 5
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": {
            "pt": "Porto Tradicional",
            "en": "Traditional Porto",
            "es": "Oporto Tradicional"
        },
        "short_description": {
            "pt": "Descubra o Porto e as suas caves de vinho",
            "en": "Discover Porto and its wine cellars",
            "es": "Descubre Oporto y sus bodegas de vino"
        },
        "description": {
            "pt": "Descubra a beleza do Porto e suas caves de vinho.",
            "en": "Discover Porto and its wine cellars.",
            "es": "Descubre la belleza de Oporto y sus bodegas."
        },
        "location": "Porto",
        "duration_hours": 4,
        "max_participants": 10,
        "tour_type": "gastronomic",
        "route_description": {
            "pt": "Ribeira, Caves de Vinho do Porto, Centro Histórico",
            "en": "Ribeira, Port Wine Cellars, Historic Center",
            "es": "Ribeira, Bodegas de Vino de Oporto, Centro Histórico"
        },
        "includes": {
            "pt": "Guia, degustação de vinho do Porto",
            "en": "Guide, Port wine tasting",
            "es": "Guía, degustación de vino de Oporto"
        },
        "excludes": {
            "pt": "Almoço, transporte",
            "en": "Lunch, transportation",
            "es": "Almuerzo, transporte"
        },
        "price": 54.99,
        "active": True,
        "images": [],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") 
            for i in range(1, 30) if (datetime.now() + timedelta(days=i)).weekday() < 5
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

async def populate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db["tours"]

    # Limpar a coleção existente
    await collection.delete_many({})
    
    # Inserir novos dados
    result = await collection.insert_many(tours_data)
    print(f"{len(result.inserted_ids)} tours inseridos com sucesso.")

    client.close()

if __name__ == "__main__":
    asyncio.run(populate())