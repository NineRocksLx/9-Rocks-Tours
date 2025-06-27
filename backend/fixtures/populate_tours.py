import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

tours_data = [
    {
        "name": "Lisboa Clássica",
        "short_description": "Passeio pelo centro histórico de Lisboa",
        "location": "Lisboa",
        "duration_hours": 4,
        "max_participants": 15,
        "tour_type": "Cultural",
        "route_description": "Baixa, Alfama, Chiado",
        "includes": ["Guia", "Entrada em monumentos", "Água"],
        "excludes": ["Almoço", "Transporte até ao ponto de encontro"],
        "description": {
            "en": "A guided tour through the historical heart of Lisbon.",
            "pt": "Uma visita guiada pelo coração histórico de Lisboa."
        },
        "price": 49.99,
        "active": True
    },
    {
        "name": "Sintra Encantada",
        "short_description": "Explore os palácios e florestas de Sintra",
        "location": "Sintra",
        "duration_hours": 5,
        "max_participants": 12,
        "tour_type": "Cultural",
        "route_description": "Palácio da Pena, Quinta da Regaleira, Centro Histórico",
        "includes": ["Guia", "Bilhetes de entrada"],
        "excludes": ["Almoço"],
        "description": {
            "en": "Explore Sintra's palaces and mystical forests.",
            "pt": "Explore os palácios e florestas místicas de Sintra."
        },
        "price": 59.99,
        "active": True
    },
    {
        "name": "Fátima Espiritual",
        "short_description": "Visite o Santuário de Fátima e arredores",
        "location": "Fátima",
        "duration_hours": 3,
        "max_participants": 20,
        "tour_type": "Religioso",
        "route_description": "Santuário de Fátima, Capelinha das Aparições",
        "includes": ["Guia"],
        "excludes": ["Transporte", "Refeições"],
        "description": {
            "en": "Visit the Sanctuary of Fatima and its surroundings.",
            "pt": "Visite o Santuário de Fátima e arredores."
        },
        "price": 39.99,
        "active": True
    },
    {
        "name": "Porto Tradicional",
        "short_description": "Descubra o Porto e as suas caves de vinho",
        "location": "Porto",
        "duration_hours": 4,
        "max_participants": 10,
        "tour_type": "Gastronómico",
        "route_description": "Ribeira, Caves de Vinho do Porto, Centro Histórico",
        "includes": ["Guia", "Degustação de vinho"],
        "excludes": ["Almoço"],
        "description": {
            "en": "Discover Porto and its wine cellars.",
            "pt": "Descubra a beleza do Porto e suas caves de vinho."
        },
        "price": 54.99,
        "active": True
    }
]

async def populate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db["tours"]

    await collection.delete_many({})
    result = await collection.insert_many(tours_data)
    print(f"{len(result.inserted_ids)} tours inseridos com sucesso.")

    client.close()

if __name__ == "__main__":
    asyncio.run(populate())
