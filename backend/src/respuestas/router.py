from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.respuestas import schemas, services

router = APIRouter(prefix="/respuestas", tags=["respuestas"])


@router.post(
    "/",
    response_model=schemas.Respuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_respuesta(
    respuesta: schemas.RespuestaCreate, db: Session = Depends(get_db)
):
    try:
        return services.crear_respuesta(db, respuesta)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
