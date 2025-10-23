from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.preguntas import schemas, services

router = APIRouter(prefix="/preguntas", tags=["preguntas"])


@router.post(
    "/",
    response_model=schemas.Pregunta,
    status_code=status.HTTP_201_CREATED,
)
def crear_pregunta(
    pregunta: schemas.PreguntaCreate, db: Session = Depends(get_db)
):
    try:
        return services.crear_pregunta(db, pregunta)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
