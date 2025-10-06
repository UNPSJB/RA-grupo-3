from pydantic import BaseModel, field_validator, model_validator
from typing import Optional,List
from datetime import datetime

class RespuestaCreate(BaseModel):
    pregunta_id: int
    texto: Optional[str] = None
    opcion_id: Optional[int] = None
    
    @model_validator(mode='after')
    def validar_texto_o_opcion(self):
        texto = self.texto
        opcion_id = self.opcion_id
        
        # Verificar que al menos uno esté presente
        if not texto and not opcion_id:
            raise ValueError('Debe proporcionar texto o opcion_id')
        
        # Verificar que NO estén ambos presentes
        if texto and opcion_id:
            raise ValueError('No puede proporcionar texto y opcion_id al mismo tiempo')
        
        return self

class RespuestasBatchCreate(BaseModel):
    respuestas: list[RespuestaCreate]

class RespuestaItem(BaseModel):
    pregunta_id: int
    texto: Optional[str] = None
    opcion_id: Optional[int] = None

    @model_validator(mode='after')
    def validar_respuesta(self):
        if self.texto is None and self.opcion_id is None:
            raise ValueError("Debe proporcionar 'texto' o 'opcion_id'.")
        if self.texto is not None and self.opcion_id is not None:
            raise ValueError("No puede proporcionar ambos 'texto' y 'opcion_id'.")
        return self


class EncuestaRespuestaCreate(BaseModel):
    respuestas: List[RespuestaItem]


class RespuestaResponse(BaseModel):
    id: int
    pregunta_id: int
    texto: Optional[str] = None
    opcion_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None 

    class Config:
        from_attributes = True
