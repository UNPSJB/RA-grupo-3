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
    # Los campos son opcionales
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    
    # Nota: No incluimos 'tipo' ni 'estado' aquí,
    # ya que 'tipo' no debería cambiar, y 'estado' 
    # se maneja con el endpoint /publicar.

# --- Schema de RESPUESTA (el que ya tenías) ---
class InstrumentoPlantilla(InstrumentoPlantillaCreate):
    id: int
    tipo: TipoInstrumento
    estado: EstadoInstrumento
    anexo: Optional[str] = None

    class Config:
        from_attributes = True