from pydantic import BaseModel
from src.enumerados import TipoInstrumento,EstadoInstrumento
from typing import Optional, List
from src.seccion.schemas import Seccion

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