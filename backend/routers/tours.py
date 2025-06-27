from fastapi import APIRouter, HTTPException, Query

@router.get("/")
async def get_all_tours(
    active_only: bool = Query(False),
    tour_type: str = Query(None),
    location: str = Query(None)
):
    query = {}
    if active_only:
        query["active"] = True
    if tour_type:
        query["type"] = tour_type
    if location:
        query["location"] = location

    tours = []
    async for tour in tours_collection.find(query):
        tours.append(tour_helper(tour))
    return tours
