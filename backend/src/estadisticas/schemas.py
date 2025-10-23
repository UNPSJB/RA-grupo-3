from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class OpcionStats(BaseModel):
    texto: str
    total: int
    porcentaje: float = Field(..., description="Porcentaje en rango 0-100")


class PreguntaAbiertaStats(BaseModel):
    pregunta_id: int
    texto: str
    total_respuestas: int
    ejemplos: List[str] = Field(default_factory=list)


class SeccionStats(BaseModel):
    id: int
    nombre: str
    total_respuestas: int
    total_respuestas_opciones: int
    total_respuestas_abiertas: int
    opciones: List[OpcionStats] = Field(default_factory=list)
    preguntas_abiertas: List[PreguntaAbiertaStats] = Field(default_factory=list)


class OpcionTotalStats(BaseModel):
    texto: str
    total: int
    porcentaje: float


class ResumenEstadisticas(BaseModel):
    total_respuestas: int
    total_respuestas_opciones: int
    opciones_totales: List[OpcionTotalStats] = Field(default_factory=list)
    secciones: List[SeccionStats] = Field(default_factory=list)
