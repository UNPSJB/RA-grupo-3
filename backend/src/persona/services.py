from sqlalchemy.orm import Session
from src.persona import models, schemas

def crear_alumno(db: Session, alumno_data: schemas.AlumnoCreate) -> models.Alumno:
    print(f"DEBUG: Datos recibidos para crear alumno: {alumno_data.model_dump()}")

    nuevo_alumno = models.Alumno(
        nombre=alumno_data.nombre 
    )
    db.add(nuevo_alumno)

    try:
        db.commit() 
        db.refresh(nuevo_alumno) 
    except Exception as e:
        db.rollback() 
        print(f"ERROR en commit al crear alumno: {e}") 
        raise 

    return nuevo_alumno