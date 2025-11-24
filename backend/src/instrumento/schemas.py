
from pydantic import BaseModel
from src.enumerados import TipoInstrumento, EstadoInstrumento, EstadoInforme
from typing import Optional, List
from src.seccion.schemas import Seccion
from datetime import datetime


class InstrumentoPlantillaCreate(BaseModel):
    titulo: str
    descripcion: str
    tipo: TipoInstrumento 

class InstrumentoPlantilla(InstrumentoPlantillaCreate):
    id: int
    estado: EstadoInstrumento
    anexo: Optional[str] = None
    
    class Config:
        from_attributes = True

class InstrumentoPlantillaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None


class InformeCurricularSimple(BaseModel):
    id: int
    materia_nombre: str
    profesor_nombre: str
    cuatrimestre_info: str
    equipamiento: Optional[str] = None
    bibliografia: Optional[str] = None
    estado: EstadoInforme

    class Config:
        from_attributes = True


class InstrumentoCompleto(InstrumentoPlantilla):
    secciones: List[Seccion] = []
    informes_curriculares_asociados: List[InformeCurricularSimple] = [] 


class InformeSinteticoInstanciaBase(BaseModel):
    id: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    tipo: TipoInstrumento
    
    model_config = {"from_attributes": True}

class InformeSinteticoInstanciaList(InformeSinteticoInstanciaBase):
    plantilla: InstrumentoPlantilla
    departamento_id: int
    cantidad_reportes: int = 0


class ResumenResponse(BaseModel):
    texto_resumen: str

class InstrumentoCompleto(InstrumentoPlantilla):
    secciones: List[Seccion] = []
    informes_curriculares_asociados: List[InformeCurricularSimple] = []
    
    # Datos de contexto
    materia_nombre: Optional[str] = None
    sede: Optional[str] = None
    anio: Optional[int] = None
    codigo: Optional[str] = None
    docente_responsable: Optional[str] = None
    

    cantidad_inscriptos: Optional[int] = 0

#Para el pdf del informe sintetico
class PreguntaRespondida(BaseModel):
    pregunta_texto: str
    respuesta_texto: str

class SeccionRespondida(BaseModel):
    seccion_nombre: str
    preguntas: List[PreguntaRespondida]

class InformeRespondido(BaseModel):
    titulo: str
    departamento: str
    fecha: datetime
    secciones: List[SeccionRespondida]