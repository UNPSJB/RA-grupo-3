
from sqlalchemy.orm import Session
from src.persona import models, schemas

def crear_alumno(db: Session, alumno_data: schemas.AlumnoCreate) -> models.Alumno:
    nueva_persona = models.Persona(nombre=alumno_data.nombre)
    db.add(nueva_persona)
    db.flush() 
    nuevo_alumno = models.Alumno(id=nueva_persona.id) 
    db.add(nuevo_alumno)
    
    db.commit() 
    db.refresh(nuevo_alumno) 
    return nuevo_alumno

