from pydantic import BaseModel
from src.enumerados import TipoInstrumento,EstadoInstrumento
from typing import Optional
class InstrumentoPlantillaCreate(BaseModel):
    titulo: str
    descripcion: str
    tipo: TipoInstrumento 

class InstrumentoPlantilla(InstrumentoPlantillaCreate):
    id: int
    titulo: str
    descripcion: str
    tipo: TipoInstrumento 
    estado: EstadoInstrumento
    
    class Config:
        from_attributes = True

class InstrumentoPlantillaUpdate(BaseModel):

    titulo: Optional[str] = None
    descripcion: Optional[str] = None

class InstrumentoPlantilla(InstrumentoPlantillaCreate):
    id: int
    tipo: TipoInstrumento
    estado: EstadoInstrumento
    anexo: Optional[str] = None

    class Config:
        from_attributes = True