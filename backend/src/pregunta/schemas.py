from pydantic import BaseModel

class PreguntaBase(BaseModel):
# mi intencion es que la seccion sea numerica para saber
# en que posicion de la encuesta va, tal vez la respuesta deba ponerse
# aca tambien, hay que charlarlo    
    seccion: int 
    descripcion: str # pregunta detallada para mostrar.

class PreguntaCreate(PreguntaBase):
    encuesta_id: int

class Pregunta(PreguntaBase):
    id: int
    encuesta_id: int
    model_config = {"from_attributes": True}