# src/instrumento/router_public.py
from fastapi import APIRouter, Depends,  HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.instrumento import services, schemas
from src.enumerados import TipoInstrumento

router = APIRouter(prefix="/instrumentos", tags=["Instrumentos"])

@router.get(
    "/plantilla/{tipo_instrumento}", 
    response_model=schemas.InstrumentoPlantilla
)
def get_plantilla_por_tipo(tipo_instrumento: TipoInstrumento, db: Session = Depends(get_db)):
    try:
        return services.get_plantilla_por_tipo(db, tipo_instrumento)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/reportes-academicos/{id_instrumento}",
    response_model=schemas.InstrumentoCompleto,
)
def get_reporte_academico_completo(id_instrumento: int, db: Session = Depends(get_db)):
    try:
        return services.get_instrumento_completo(db, id_instrumento)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
