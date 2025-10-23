from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.secciones import schemas, services

router = APIRouter(prefix="/secciones", tags=["secciones"])


@router.post(
    "/",
    response_model=schemas.Seccion,
    status_code=status.HTTP_201_CREATED,
)
def crear_seccion(
    seccion: schemas.SeccionCreate, db: Session = Depends(get_db)
):
    try:
        return services.crear_seccion(db, seccion)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
