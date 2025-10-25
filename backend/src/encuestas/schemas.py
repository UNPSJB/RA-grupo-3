from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from src.enumerados import EstadoInstancia, EstadoEncuesta

from src.seccion.schemas import Seccion

#plantilla

class EncuestaAlumnoPlantillaBase(BaseModel):
    titulo: str
    descripcion: str
    
class EncuestaAlumnoPlantillaCreate(EncuestaAlumnoPlantillaBase):
    estado: EstadoEncuesta = Field(default = EstadoEncuesta.BORRADOR)

class EncuestaAlumnoPlantilla(EncuestaAlumnoPlantillaBase):
    id: int
    estado: EstadoEncuesta
    secciones: list[Seccion] = [] # Cargar las secciones
    
    model_config = {"from_attributes": True}

class EncuestaAlumnoPlantillaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None

#instancia

class EncuestaInstanciaBase(BaseModel):
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    estado: EstadoInstancia = Field(default = EstadoInstancia.PENDIENTE)

class EncuestaInstanciaCreate(EncuestaInstanciaBase):
    cursada_id: int
    plantilla_id: int

class EncuestaInstancia(EncuestaInstanciaBase):
    id: int
    cursada_id: int
    plantilla_id: int
    plantilla: EncuestaAlumnoPlantilla
    model_config = {"from_attributes": True}