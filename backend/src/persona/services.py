from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.persona import models, schemas

# --- Importamos los modelos necesarios para el cruce de datos ---
from src.materia.models import Sede, Departamento, Carrera, Materia, Cursada 

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

def listar_sedes_de_profesor(db: Session, profesor_id: int) -> List[Sede]:
    """
    Obtiene las sedes únicas donde el profesor tiene cursadas asignadas.
    Ruta: Sede -> Departamento -> Carrera -> Materia -> Cursada -> Profesor
    """
    stmt = (
        select(Sede)
        .join(Departamento, Sede.id == Departamento.sede_id)
        .join(Carrera, Departamento.id == Carrera.departamento_id)
        .join(Materia, Carrera.materias) # Usamos la relación desde Carrera hacia Materia
        .join(Cursada, Materia.id == Cursada.materia_id)
        .where(Cursada.profesor_id == profesor_id)
        .distinct()
    )
    return db.scalars(stmt).all()