# src/encuestas/router_admin.py
from fastapi import APIRouter, Depends, HTTPException, status 
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import  schemas, services
from src.exceptions import NotFound,BadRequest
# --- CAMBIO: Importar el guardia de Secretaria ---
from src.dependencies import get_current_admin_secretaria

    
router_gestion = APIRouter(
    prefix="/admin/gestion-encuestas", 
    tags=["Admin Encuestas - Instancias"],
    # --- CAMBIO: Proteger con el guardia de Secretaria ---
    dependencies=[Depends(get_current_admin_secretaria)]
)

# ... (Pega el resto de tus rutas @router_gestion.post, @router_gestion.patch aquí) ...
@router_gestion.post(
    "/activar",
    response_model=schemas.EncuestaInstancia,
    status_code=status.HTTP_201_CREATED     
)
def activar_encuesta_cursada(
    data: schemas.EncuestaInstanciaCreate,
    db: Session = Depends(get_db)
):
    try:
        nueva_instancia = services.activar_encuesta_para_cursada(db, data=data)
        return nueva_instancia
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BadRequest as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al activar encuesta: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al activar la encuesta."
        )
    
@router_gestion.patch(
    "/instancia/{instancia_id}/cerrar",
    response_model=schemas.EncuestaInstancia 
)
def cerrar_encuesta_instancia(
    instancia_id: int,
    db: Session = Depends(get_db)
):
    try:
        instancia_cerrada = services.cerrar_instancia_encuesta(db, instancia_id=instancia_id)
        return instancia_cerrada
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BadRequest as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al cerrar instancia {instancia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al cerrar la encuesta."
        )