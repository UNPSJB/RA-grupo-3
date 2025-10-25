
from pydantic import BaseModel
from typing import Optional

class PersonaBase(BaseModel):
    nombre: str


class AlumnoCreate(PersonaBase):
    pass 


class Alumno(PersonaBase):
    id: int
    
    model_config = {"from_attributes": True}


class ProfesorCreate(PersonaBase):
    pass

class Profesor(PersonaBase):
    id: int
    model_config = {"from_attributes": True}