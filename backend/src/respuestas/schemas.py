from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RespuestaCreate(BaseModel):
    pregunta_id: int
    texto_respuesta: Optional[str] = Field(default=None, max_length=500)
    opcion_seleccionada_id: Optional[int] = Field(default=None)


class Respuesta(BaseModel):
    id: int
    pregunta_id: int
    opcion_id: Optional[int] = None
    texto: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
