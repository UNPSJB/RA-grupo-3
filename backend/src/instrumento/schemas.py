from pydantic import BaseModel
from src.enumerados import TipoInstrumento,EstadoInstrumento
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

class InstrumentoCompleto(InstrumentoPlantilla):
    secciones: List[Seccion] = []

class InformeSinteticoInstanciaBase(BaseModel):
    id: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    tipo: TipoInstrumento
    
    model_config = {"from_attributes": True}

class InformeSinteticoInstanciaList(InformeSinteticoInstanciaBase):
    """Schema para listar informes sintéticos ya generados."""
    plantilla: InstrumentoPlantilla
    departamento_id: int
    cantidad_reportes: int = 0