from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.persona import schemas, services

router = APIRouter(prefix="/alumnos", tags=["Alumnos"])

@router.post("/", response_model=schemas.Alumno)
def crear_nuevo_alumno(
    alumno_data: schemas.AlumnoCreate, 
    db: Session = Depends(get_db)
):
    nuevo_alumno = services.crear_alumno(db=db, alumno_data=alumno_data)
    return nuevo_alumno

