from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field

from src.preguntas.schemas import Pregunta


class SeccionBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)


class SeccionCreate(SeccionBase):
    encuesta_id: int


class Seccion(SeccionBase):
    id: int
    preguntas: List[Pregunta] = Field(default_factory=list)

    model_config = {"from_attributes": True}


Seccion.model_rebuild()
