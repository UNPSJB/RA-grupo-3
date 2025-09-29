from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.encuestas.models import TipoCuatrimestre
from src.pregunta.schemas import Pregunta
from src.encuestas.models import TipoCuatrimestre


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
    titulo: str
    descripcion: str
    anio_carrera: int
    cursada: TipoCuatrimestre
    model_config = {"from_attributes": True}

<<<<<<< HEAD

class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = Field(default_factory=list)
=======
"""#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = []"""
>>>>>>> aa33c2973574089f1a101fe82c29d7cd784e78df
