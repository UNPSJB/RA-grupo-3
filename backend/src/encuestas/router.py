from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.encuestas import schemas, services

router = APIRouter(prefix="/encuestas", tags=["encuestas"])


@router.post(
    "/",
    response_model=schemas.Encuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_encuesta(
    encuesta: schemas.EncuestaCreate, db: Session = Depends(get_db)
):
    return services.crear_encuesta(db, encuesta)


@router.get(
    "/{encuesta_id:int}",
    response_model=schemas.EncuestaDetalle,
    status_code=status.HTTP_200_OK,
)
def obtener_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
):
    encuesta = services.obtener_encuesta(db, encuesta_id)
    if encuesta is None:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    return encuesta


@router.get(
    "/{estado}",
    response_model=list[schemas.Encuesta],
    status_code=status.HTTP_200_OK,
)
def listar_por_estado(estado: str, db: Session = Depends(get_db)):
    try:
        return services.listar_por_estado(db, estado)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch(
    "/{encuesta_id:int}/publicar",
    response_model=schemas.Encuesta,
    status_code=status.HTTP_200_OK,
)
def publicar_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
):
    encuesta = services.publicar_encuesta(db, encuesta_id)
    if encuesta is None:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    return encuesta


@router.delete(
    "/{encuesta_id:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def eliminar_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
) -> Response:
    eliminada = services.eliminar_encuesta(db, encuesta_id)
    if not eliminada:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
