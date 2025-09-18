from pydantic import BaseModel
from src.pregunta.schemas import Pregunta


class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str

class EncuestaCreate(EncuestaBase):
    pass

class Encuesta(EncuestaBase):
    id: int

    model_config = {"from_attributes": True}

#para devolver la encuesta junto con sus preguntas
class EncuestaConPreguntas(Encuesta):
    preguntas: list[Pregunta] = []