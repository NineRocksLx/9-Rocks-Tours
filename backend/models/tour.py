from pydantic import BaseModel, Field
from typing import Optional

class Tour(BaseModel):
    title: str = Field(...)
    description: str = Field(...)
    price: float = Field(...)
    active: Optional[bool] = True

class UpdateTour(BaseModel):
    title: Optional[str]
    description: Optional[str]
    price: Optional[float]
    active: Optional[bool]
