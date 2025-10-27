from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from src.enumerados import EstadoInstancia, EstadoEncuesta,TipoPregunta

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

class PlantillaInfo(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str] = None

    model_config = {"from_attributes": True}

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

class EncuestaActivaAlumnoResponse(BaseModel):
    instancia_id: int
    plantilla: PlantillaInfo 
    materia_nombre: Optional[str] = None 
    fecha_fin: Optional[datetime] = None 

    model_config = {"from_attributes": True}

class InstanciaConPlantillaResponse(BaseModel):
     instancia_id: int
     plantilla: EncuestaAlumnoPlantilla


class ResultadoOpcion(BaseModel):
    opcion_id: int
    opcion_texto: str
    cantidad: int 

class RespuestaTextoItem(BaseModel):
    texto: str

class ResultadoPregunta(BaseModel):
    pregunta_id: int
    pregunta_texto: str
    pregunta_tipo: TipoPregunta 
    resultados_opciones: Optional[List[ResultadoOpcion]] = None
    respuestas_texto: Optional[List[RespuestaTextoItem]] = None

    model_config = {"from_attributes": True} 


class ResultadoCursada(BaseModel):
    cursada_id: int
    materia_nombre: str
    cuatrimestre_info: str 
    cantidad_respuestas: int 
    resultados_por_pregunta: List[ResultadoPregunta]

    model_config = {"from_attributes": True}
