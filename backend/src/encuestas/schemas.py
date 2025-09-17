from pydantic import BaseModel


class EncuestaBase(BaseModel):
    titulo: str
    descripcion: str

class EncuestaCreate(EncuestaBase):
    pass

class Encuesta(EncuestaBase):
    id: int

    model_config = {"from_attributes": True}