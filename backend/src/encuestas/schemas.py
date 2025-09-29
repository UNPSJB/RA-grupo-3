from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.encuestas.models import TipoCuatrimestre
from src.pregunta.schemas import Pregunta


class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str
    anio_carrera: int
    cursada: TipoCuatrimestre
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    esta_completa: bool = False


class EncuestaCreate(EncuestaBase):
    pass


class Encuesta(EncuestaBase):
    id: int

    model_config = {"from_attributes": True}


class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = Field(default_factory=list)
