from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.encuestas.models import Encuesta
from src.estadisticas import schemas, services

router = APIRouter(prefix="/estadisticas", tags=["estadisticas"])


@router.get(
    "/",
    response_model=schemas.ResumenEstadisticas,
    status_code=status.HTTP_200_OK,
)
def obtener_resumen(db: Session = Depends(get_db)) -> schemas.ResumenEstadisticas:
    return services.obtener_resumen(db)


@router.get(
    "/encuestas/{encuesta_id}",
    response_model=schemas.ResumenEstadisticas,
    status_code=status.HTTP_200_OK,
)
def obtener_resumen_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
) -> schemas.ResumenEstadisticas:
    if db.get(Encuesta, encuesta_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encuesta no encontrada",
        )
    return services.obtener_resumen(db, encuesta_id=encuesta_id)
