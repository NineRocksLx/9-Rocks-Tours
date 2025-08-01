# backend/models/tour.py
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

class Tour(BaseModel):
   id: Optional[str] = None
   name: Optional[Dict[str, str]] = None
   short_description: Optional[Dict[str, str]] = None
   description: Optional[Dict[str, str]] = None
   price: Optional[float] = None
   duration_hours: Optional[int] = None
   max_participants: Optional[int] = None
   location: Optional[str] = None
   tour_type: Optional[str] = None
   featured: Optional[bool] = False
   active: Optional[bool] = True
   order: Optional[int] = 999
   images: Optional[List[str]] = None
   map_locations: Optional[str] = None  # String com localizações
   images: List[str]
   active: bool = True
   featured: bool = False
   available_dates: List[str]  # ✅ ADIÇÃO: list[str] para datas disponíveis (ex.: ["2025-07-23", "2025-07-24"])
   occupied_dates: List[str] = []  # Datas ocupadas
   created_at: datetime
   updated_at: datetime