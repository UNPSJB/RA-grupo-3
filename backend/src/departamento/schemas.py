from pydantic import BaseModel
from src.enumerados import EstadoInforme

class InformeCurricularStatus(BaseModel):
    id: int
    estado: EstadoInforme
    materia_nombre: str
    profesor_nombre: str
    cuatrimestre_info: str

    model_config = {"from_attributes": True}
    