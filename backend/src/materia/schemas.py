from pydantic import BaseModel
from typing import Optional
from datetime import datetime 
from src.enumerados import CicloMateria

class MateriaBase(BaseModel):
    nombre: str
    descripcion: str 
    ciclo: CicloMateria

class MateriaCreate(MateriaBase):
    pass 


class Materia(MateriaBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True} # Para compatibilidad con SQLAlchemy