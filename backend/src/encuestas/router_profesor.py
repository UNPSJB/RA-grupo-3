from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas as encuestas_schemas
from src.encuestas import services as services_encuestas
from src.persona.models import Profesor
from src.dependencies import get_current_profesor
from src.instrumento import services as services_instrumento
from src.instrumento import schemas as schemas_instrumento

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

@router_profesores.get(
    "/reporte/instancia/{instancia_id}/detalles",
    response_model=schemas_instrumento.InstrumentoCompleto
)
def get_detalles_reporte_para_responder(
    instancia_id: int,
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    try:
        plantilla_completa = services_instrumento.get_plantilla_para_instancia_reporte(
            db=db, 
            instancia_id=instancia_id,
            profesor_id=profesor_actual.id  # Pasa el ID del profesor para auth
        )
        return plantilla_completa
        
    except HTTPException as e:
        # Re-lanza las excepciones HTTP (404, 403, 400)
        raise e
    except Exception as e:
        print(f"Error inesperado al obtener detalles de reporte {instancia_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error al obtener los detalles del reporte."
        )
    
@router_profesores.get(
    "/dashboard",
    response_model=list[encuestas_schemas.DashboardProfesorItem]
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    profesor: Profesor = Depends(get_current_profesor)
):
    """
    Devuelve métricas clave para el dashboard del profesor (año actual).
    """
    try:
        return services_encuestas.obtener_dashboard_profesor(db, profesor.id)
    except Exception as e:
        print(f"Error al obtener dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error al cargar el dashboard.")



@router_profesores.get(
    "/mis-informes-historicos",
    response_model=list[encuestas_schemas.InformeHistoricoResponse]
)
def listar_historial_informes_profesor(
    db: Session = Depends(get_db),
    profesor_actual: Profesor = Depends(get_current_profesor)
):
    """
    Retorna el historial de informes de actividad curricular completados por el docente.
    """
    try:
        return services_encuestas.obtener_informes_historicos_profesor(db, profesor_id=profesor_actual.id)
    except Exception as e:
        print(f"Error al listar historial de informes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener el historial de informes."
        )