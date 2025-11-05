from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime

class RespuestaIndividualCreate(BaseModel):
    pregunta_id: int
    opcion_id: Optional[int] = None
    texto: Optional[str] = None

    @model_validator(mode='after')
    def check_opcion_or_texto(self) -> 'RespuestaIndividualCreate':
        if self.opcion_id is not None and self.texto is not None:
            raise ValueError("Solo se puede proveer 'opcion_id' o 'texto', no ambos.")
        if self.opcion_id is None and self.texto is None:
            raise ValueError("Se debe proveer 'opcion_id' o 'texto'.")
        return self

class RespuestaSetCreate(BaseModel):
    respuestas: List[RespuestaIndividualCreate]



class RespuestaResponse(BaseModel):
    id: int
    pregunta_id: int
    respuesta_set_id: int 
    texto: Optional[str] = None
    opcion_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class RespuestaSetResponse(BaseModel):
    id: int
    instrumento_instancia_id: int
    created_at: datetime
    respuestas: List[RespuestaResponse]

    model_config = {"from_attributes": True}