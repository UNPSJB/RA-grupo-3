from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.encuestas.models import TipoCuatrimestre
from src.seccion.schemas import Seccion


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

#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    secciones: list[Seccion] = []
