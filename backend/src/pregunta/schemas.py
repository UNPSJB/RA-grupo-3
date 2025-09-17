from pydantic import BaseModel

class PreguntaBase(BaseModel):
    seccion: int
    descripcion: str

class PreguntaCreate(PreguntaBase):
    pass

class Pregunta(PreguntaBase):
    id: int
    model_config = {"from_attributes": True}