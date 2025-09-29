from src.pregunta.schemas import Pregunta
from pydantic import BaseModel

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.encuestas.models import TipoCuatrimestre
else:
    # Define el enum localmente para runtime
    from enum import Enum as PyEnum
    class TipoCuatrimestre(str, PyEnum):
        PRIMERO = "primero"
        SEGUNDO = "segundo"
        ANUAL = "anual"

class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str
    anio_carrera: int  #agregue esto porque el model lo requiere
    cursada: TipoCuatrimestre # y esto tambien

class EncuestaCreate(EncuestaBase):
    pass

class Encuesta(EncuestaBase):
    id: int

    model_config = {"from_attributes": True}

#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = []