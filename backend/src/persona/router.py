from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from src.database import get_db
from src.persona import schemas, services
from src.dependencies import get_current_profesor 
from src.persona.models import Profesor
from src.encuestas import services as profesor_services 
from src.exceptions import BadRequest
from src.encuestas import schemas as encuestas_schemas
from src.materia import schemas as materia_schemas


router = APIRouter(prefix="/alumnos", tags=["Alumnos"])

@router.post("/", response_model=schemas.Alumno)
def crear_nuevo_alumno(
    alumno_data: schemas.AlumnoCreate, 
    db: Session = Depends(get_db)
):
    nuevo_alumno = services.crear_alumno(db=db, alumno_data=alumno_data)
    return nuevo_alumno

router_profesor = APIRouter(prefix="/profesor", tags=["Profesor"])
#tengo este esquema, tengo model, y necesito crear 10 alumnos para simular respuestas (decirle al chatgpt que genere esos datos)

@router_profesor.get(
    "/mis-resultados",
    response_model=List[encuestas_schemas.ResultadoCursada]
)
def get_mis_encuestas_cerradas(
    cuatrimestre_id: Optional[int] = None,
    anio: Optional[int] = None,
    materia_id: Optional[int] = None,
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    try:
        instancias_cerradas = profesor_services.obtener_resultados_agregados_profesor(
            db,
            profesor_id=profesor_actual.id,
            cuatrimestre_id=cuatrimestre_id,
            anio=anio,
            materia_id=materia_id
        )
        return instancias_cerradas
    except Exception as e:
        print(f"Error inesperado al listar resultados para profesor {profesor_actual.id}: {e}")
        import traceback
        traceback.print_exc()
        raise BadRequest(detail="Ocurrió un error al obtener los resultados.")
    
@router_profesor.get(
    "/mis-materias",
    response_model=List[materia_schemas.Materia]
)
def get_mis_materias(
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    """Obtiene todas las materias que ha dictado el profesor."""
    try:
        return profesor_services.listar_materias_de_profesor(db, profesor_actual.id)
    except Exception as e:
        print(f"Error al listar materias del profesor: {e}")
        raise BadRequest(detail="Error al obtener las materias.")