from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.respuesta import schemas as respuesta_schemas
from src.respuesta import services as respuesta_services
from src.persona.models import Alumno, Profesor
from src.dependencies import get_current_alumno, get_current_profesor
from src.exceptions import NotFound, BadRequest

router = APIRouter(tags=["Respuestas"])

@router.post(
    "/encuestas-abiertas/instancia/{instancia_id}/responder",
    status_code=201
)
def responder_encuesta_completa(
    instancia_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate,
    db: Session = Depends(get_db),
    alumno_actual: Alumno = Depends(get_current_alumno)
):
    try:
        respuesta_services.crear_submission_anonima(
            db=db,
            instancia_id=instancia_id,
            alumno_id=alumno_actual.id,
            respuestas_data=respuestas_data
        )
        return {"message": "Respuestas enviadas correctamente. ¡Gracias!"}
    except BadRequest as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
         print(f"Error inesperado al procesar respuestas: {e}")
         raise HTTPException(status_code=500, detail="Ocurrió un error procesando las respuestas.")
    

@router.post(
    "/reportes-abiertas/instancia/{instancia_id}/responder",
    status_code=201
)
def responder_reporte_completa(
    instancia_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate,
    db: Session = Depends(get_db),
    profesor: Profesor = Depends(get_current_profesor)
):
    try:
        respuesta_services.crear_submission_profesor(
            db=db,
            instancia_id = instancia_id,
            alumno_id = profesor.id,
            respuestas_data = respuestas_data
        )
        return {"message": "Respuestas enviadas correctamente. ¡Gracias!"}
    except BadRequest as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
         print(f"Error inesperado al procesar respuestas: {e}")
         raise HTTPException(status_code=500, detail="Ocurrió un error procesando las respuestas.")