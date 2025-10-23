from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_serializer

from src.enumerados import EstadoEncuestaEnum, TipoCursadaEnum
from src.secciones.schemas import Seccion


class EncuestaBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=255)
    descripcion: str = Field(..., min_length=3)
    anio_carrera: Optional[int] = Field(
        default=None, ge=1, le=6, description="Año de la carrera al que apunta"
    )
    cursada: TipoCursadaEnum
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    esta_completa: bool = False


class EncuestaCreate(EncuestaBase):
    pass


class Encuesta(EncuestaBase):
    id: int
    estado: EstadoEncuestaEnum
    preguntas: List[dict] = Field(default_factory=list)

    model_config = {"from_attributes": True}

    @field_serializer("estado")
    def serialize_estado(self, estado: EstadoEncuestaEnum) -> str:
        return (
            "publicadas"
            if estado == EstadoEncuestaEnum.PUBLICADA
            else "borradores"
        )


class EncuestaDetalle(Encuesta):
    secciones: List[Seccion] = Field(default_factory=list)

    model_config = {"from_attributes": True}


Encuesta.model_rebuild()
EncuestaDetalle.model_rebuild()
