from typing import Optional, List
from pydantic import BaseModel
from tablas.pregunta.schemas import Pregunta

class SeccionBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None

class SeccionCreate(SeccionBase):
    pass

class Seccion(SeccionBase):
    id: int
    preguntas: List[Pregunta] = []
    model_config = {"from_attributes": True}

class SeccionUpdate(SeccionBase):
    pass