from typing import List, Optional
from pydantic import BaseModel, Field
from src.pregunta.schemas import Pregunta

class SeccionBase(BaseModel):
    nombre: str = Field(..., min_length=5, max_length=100)

class SeccionCreate(SeccionBase):
    encuesta_id: int


class Seccion(SeccionBase):
    id: int
    preguntas: Optional[List[Pregunta]] = None 
    model_config = {"from_attributes": True}