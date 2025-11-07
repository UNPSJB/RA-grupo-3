from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from src.seccion.schemas import Seccion

from src.enumerados import EstadoInstancia,TipoPregunta,TipoInstrumento


#instrumento
class InstrumentoBaseCreate(BaseModel):
    titulo: str
    descripcion: str

class InstrumentoBase(InstrumentoBaseCreate):
    id: int
    tipo: TipoInstrumento 

    class Config:
        from_attributes = True 

#plantilla
    
class EncuestaAlumnoPlantillaCreate(InstrumentoBaseCreate):
    pass

class EncuestaAlumnoPlantilla(InstrumentoBase):
    secciones: Optional[List[Seccion]] = None   #Linea agregada para poder probar listar la encuesta con sus secciones y preguntas
    pass

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
    ha_respondido: bool

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


class ResultadoSeccion(BaseModel):
    seccion_nombre: str
    resultados_por_pregunta: List[ResultadoPregunta]
    model_config = {"from_attributes": True}

class ResultadoCursada(BaseModel):
    cursada_id: int
    materia_nombre: str
    cuatrimestre_info: str 
    cantidad_respuestas: int 
    

    resultados_por_seccion: List[ResultadoSeccion]  

    model_config = {"from_attributes": True}