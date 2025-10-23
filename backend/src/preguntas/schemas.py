from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from src.enumerados import TipoPreguntaEnum


class OpcionBase(BaseModel):
    texto: str = Field(..., min_length=1, max_length=255)


class OpcionCreate(OpcionBase):
    pass


class Opcion(OpcionBase):
    id: int

    model_config = {"from_attributes": True}


class PreguntaBase(BaseModel):
    texto: str = Field(..., min_length=3, max_length=500)
    tipo: TipoPreguntaEnum


class PreguntaCreate(PreguntaBase):
    seccion_id: int
    opciones: Optional[List[OpcionCreate]] = None


class Pregunta(PreguntaBase):
    id: int
    opciones: List[Opcion] = Field(default_factory=list)

    model_config = {"from_attributes": True}
