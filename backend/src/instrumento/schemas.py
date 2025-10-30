from pydantic import BaseModel
from src.enumerados import TipoInstrumento

class InstrumentoPlantillaCreate(BaseModel):
    titulo: str
    descripcion: str
    tipo: TipoInstrumento 

class InstrumentoPlantilla(InstrumentoPlantillaCreate):
    id: int
    
    class Config:
        from_attributes = True