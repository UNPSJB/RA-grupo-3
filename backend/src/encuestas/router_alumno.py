from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas as encuestas_schemas
from src.respuesta import schemas as respuesta_schemas
from src.encuestas import services as services_alumno 
from src.respuesta import services as respuesta_services
from src.persona.models import Alumno
from src.dependencies import get_current_alumno
from src.exceptions import NotFound, BadRequest
router_alumnos = APIRouter(prefix="/encuestas-abiertas", tags=["Encuestas Alumnos"])

@router_alumnos.get(
    "/cursada/{cursada_id}",
    response_model=encuestas_schemas.EncuestaAlumnoPlantilla
)
def obtener_encuesta_para_responder(
    cursada_id: int,
    db: Session = Depends(get_db),
    alumno_actual: Alumno = Depends(get_current_alumno)
):
    try:
        instancia = services_alumno.obtener_instancia_activa_por_cursada(db, cursada_id)

        if not instancia.plantilla:
            raise HTTPException(status_code=500, detail="Instancia encontrada pero no tiene plantilla asociada.")
        return instancia.plantilla
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al obtener encuesta para responder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al obtener la encuesta."
        )


@router_alumnos.post(
    "/instancia/{instancia_id}/responder",
    status_code=status.HTTP_201_CREATED
)
def responder_encuesta(
    instancia_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate,
    db: Session = Depends(get_db),
    alumno_actual: Alumno = Depends(get_current_alumno)
):
    try:
        respuesta_services.crear_submission_anonima(
            db=db,
            instancia_id=instancia_id,
            respuestas_data=respuestas_data
        )
        return {"message": "Respuestas enviadas correctamente. ¡Gracias!"}
    except BadRequest as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al procesar respuestas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al procesar las respuestas."
        )



