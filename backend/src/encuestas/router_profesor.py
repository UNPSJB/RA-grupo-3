from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas as encuestas_schemas
from src.encuestas import services as services_encuestas
from src.persona.models import Profesor
from src.dependencies import get_current_profesor

router_profesores = APIRouter(prefix="/encuestas-abiertas", tags=["Encuestas Profesores"])

@router_profesores.get(
    "/mis-instancias-activas-profesor",
    response_model=list[encuestas_schemas.EncuestaActivaAlumnoResponse]
)
def listar_mis_reportes_activos(
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    try:
        lista_final = services_encuestas.obtener_instancias_activas_profesor(db, profesor_id=profesor_actual.id)
        return lista_final
    except Exception as e:
        print(f"Error inesperado al listar reportes activos para profesor {profesor_actual.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al obtener los reportes activos."
        )
