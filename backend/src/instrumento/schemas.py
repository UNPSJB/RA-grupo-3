
from pydantic import BaseModel
from src.enumerados import TipoInstrumento, EstadoInstrumento, EstadoInforme
from typing import Optional, List
from src.seccion.schemas import Seccion
from datetime import datetime

# --- CLASES EXISTENTES (NO TOCAR) ---
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

# --- AGREGADO: Estructura simple para el informe curricular hijo ---
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

# --- MODIFICADO: Agregamos la lista a InstrumentoCompleto ---
class InstrumentoCompleto(InstrumentoPlantilla):
    secciones: List[Seccion] = []
    # Campo nuevo:
    informes_curriculares_asociados: List[InformeCurricularSimple] = [] 

# --- CLASES EXISTENTES (NO TOCAR) ---
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