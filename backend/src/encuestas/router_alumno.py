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
    "/mis-instancias-activas",
    response_model=list[encuestas_schemas.EncuestaActivaAlumnoResponse] 
)
def listar_mis_encuestas_activas(
    db: Session = Depends(get_db),
    alumno_actual: Alumno = Depends(get_current_alumno)
):
    try:
        #ajuste para devolver un dict en vez de un objeto
        lista_final = services_alumno.obtener_instancias_activas_alumno(db, alumno_id=alumno_actual.id)
        return lista_final
    except Exception as e:
        print(f"Error inesperado al listar encuestas activas para alumno {alumno_actual.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al obtener las encuestas activas."
        )

@router_alumnos.get(
    "/cursada/{cursada_id}/activa", 
    response_model=encuestas_schemas.InstanciaConPlantillaResponse 
)

def obtener_encuesta_activa_para_responder( 
    cursada_id: int,
    db: Session = Depends(get_db),
    alumno_actual: Alumno = Depends(get_current_alumno) 
):

    try:

        instancia = services_alumno.obtener_instancia_activa_por_cursada(db, cursada_id)
        if not instancia.plantilla:
            raise HTTPException(status_code=500, detail="Instancia encontrada pero no tiene plantilla asociada.")

        return encuestas_schemas.InstanciaConPlantillaResponse(
            instancia_id=instancia.id,
            plantilla=instancia.plantilla
        )
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al obtener encuesta activa para responder (cursada {cursada_id}): {e}")
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

@router_alumnos.get(
    "/instancia/{instancia_id}/detalles",
    response_model=encuestas_schemas.EncuestaAlumnoPlantilla
)
def obtener_detalles_encuesta_para_responder(
    instancia_id: int,
    db: Session = Depends(get_db),
):
    try:
        plantilla_completa = services_alumno.obtener_plantilla_para_instancia_activa(db, instancia_id=instancia_id)
        return plantilla_completa
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al obtener detalles de instancia {instancia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al obtener los detalles de la encuesta."
        )


