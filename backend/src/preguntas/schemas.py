from pydantic import BaseModel, Field
from typing import List, Optional


class OpcionBase(BaseModel):
    texto: str = Field(..., min_length=1, max_length=255)


class OpcionCreate(OpcionBase):
    pass


class Opcion(OpcionBase):
    id: int
    model_config = {"from_attributes": True}


class PreguntaBase(BaseModel):
    texto: str = Field(..., min_length=5, max_length=500)
    tipo: str = Field(..., pattern="^(MULTIPLE_CHOICE|REDACCION)$")


class PreguntaCreate(PreguntaBase):
    opciones: Optional[List[OpcionCreate]] = None


class PreguntaUpdate(PreguntaBase):
    opciones: Optional[List[OpcionCreate]] = None


class Pregunta(PreguntaBase):
    id: int
    opciones: Optional[List[Opcion]] = None
    model_config = {"from_attributes": True}
