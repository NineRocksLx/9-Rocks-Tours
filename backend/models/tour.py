from fastapi import APIRouter, HTTPException, Query
from config.firestore_db import tours_collection

router = APIRouter()

async def tour_helper(tour):
    return {**tour.to_dict(), "id": tour.id}

@router.get("/")
async def get_all_tours(
    active_only: bool = Query(False),
    tour_type: str = Query(None),
    location: str = Query(None)
):
    query = tours_collection
    if active_only:
        query = query.where("active", "==", True)
    if tour_type:
        query = query.where("tour_type", "==", tour_type)
    if location:
        query = query.where("location", ">=", location).where("location", "<=", location + "\uf8ff")  # Pesquisa parcial

    tours = []
    async for doc in query.stream():
        tours.append(await tour_helper(doc))
    return tours