from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from src.pregunta.schemas import Pregunta
from src.enumerados import TipoCuatrimestre, EstadoEncuesta

from src.encuestas.models import TipoCuatrimestre
from src.seccion.schemas import Seccion


class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str
    anio_carrera: int
    cursada: TipoCuatrimestre

class EncuestaCreate(EncuestaBase):
    estado: EstadoEncuesta = Field(default = EstadoEncuesta.BORRADOR)

class Encuesta(EncuestaBase):
    id: int
    fecha_inicio: Optional[datetime] = None 
    fecha_fin: Optional[datetime] = None    
    estado: EstadoEncuesta                  
    model_config = {"from_attributes": True}

class EncuestaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    anio_carrera: Optional[int] = None
    cursada: Optional[TipoCuatrimestre] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    secciones: list[Seccion] = []
