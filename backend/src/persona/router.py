from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from src.database import get_db
from src.persona import schemas, services
from src.dependencies import get_current_profesor 
from src.persona.models import Profesor
from src.encuestas import services as profesor_services 
from src.exceptions import NotFound, BadRequest
from src.encuestas.schemas import EncuestaInstancia

router = APIRouter(prefix="/alumnos", tags=["Alumnos"])

@router.post("/", response_model=schemas.Alumno)
def crear_nuevo_alumno(
    alumno_data: schemas.AlumnoCreate, 
    db: Session = Depends(get_db)
):
    nuevo_alumno = services.crear_alumno(db=db, alumno_data=alumno_data)
    return nuevo_alumno

router_profesor = APIRouter(prefix="/profesor", tags=["Profesor"])


@router_profesor.get(
    "/mis-resultados",
    response_model=List[EncuestaInstancia]
)
def get_mis_encuestas_cerradas(
    cuatrimestre_id: Optional[int] = None,
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    try:
        instancias_cerradas = profesor_services.listar_instancias_cerradas_profesor(
            db,
            profesor_id=profesor_actual.id,
            cuatrimestre_id=cuatrimestre_id
        )
        return instancias_cerradas
    except Exception as e:
        print(f"Error inesperado al listar encuestas cerradas para profesor {profesor_actual.id}: {e}")
        import traceback
        traceback.print_exc()
        raise BadRequest(detail="Ocurrió un error al obtener las encuestas cerradas.")
