from pydantic import BaseModel
from src.pregunta.schemas import Pregunta
from src.encuestas.models import TipoCuatrimestre


class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str
    anio_carrera: int  #agregue esto porque el model lo requiere
    cursada: TipoCuatrimestre # y esto tambien

class EncuestaCreate(EncuestaBase):
    pass

class Encuesta(EncuestaBase):
    id: int
    titulo: str
    descripcion: str
    anio_carrera: int
    cursada: TipoCuatrimestre
    model_config = {"from_attributes": True}

"""#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = []"""