from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict

from src.database import get_db
from src.instrumento import services as instrumento_services
from src.instrumento import schemas as instrumento_schemas

router = APIRouter(prefix="/departamento/informes-sinteticos", tags=["Departamento Informes Sintéticos"])

@router.post(
    "/instancia/{informe_id}/crear",
    status_code=status.HTTP_201_CREATED
)
def crear_instancia_informe_sintetico(
    informe_id: int,
    departamento_id: int | None = None,  
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    
    #Crea una instancia de informe sintético a partir de la plantilla (informe_id).
    
    try:
        instancia = instrumento_services.crear_instancia_informe_sintetico(db, informe_id, departamento_id)
        return {"instancia_id": instancia.id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/instancia/{instancia_id}/detalles",
    response_model=instrumento_schemas.InstrumentoCompleto
)
def get_detalles_instancia_sintetico(
    instancia_id: int,
    departamento_id: int | None = None,
    db: Session = Depends(get_db)
):
    #Devuelve la plantilla (con secciones y preguntas) asociada a la instancia.
    
    try:
        plantilla = instrumento_services.get_plantilla_para_instancia_sintetico(db, instancia_id, departamento_id)
        return plantilla
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
