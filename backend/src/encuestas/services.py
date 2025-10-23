from __future__ import annotations

from typing import Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.encuestas import schemas
from src.encuestas.models import Encuesta
from src.enumerados import EstadoEncuestaEnum
from src.preguntas.models import Pregunta
from src.secciones.models import Seccion

_ESTADO_MAP = {
    "borradores": EstadoEncuestaEnum.BORRADOR,
    "borrador": EstadoEncuestaEnum.BORRADOR,
    "publicadas": EstadoEncuestaEnum.PUBLICADA,
    "publicada": EstadoEncuestaEnum.PUBLICADA,
}


def _parse_estado(valor: str) -> EstadoEncuestaEnum:
    try:
        return _ESTADO_MAP[valor.lower()]
    except KeyError as exc:  # pragma: no cover - Validado en router
        raise ValueError(f"Estado inválido: {valor}") from exc


def crear_encuesta(
    db: Session, encuesta: schemas.EncuestaCreate
) -> schemas.Encuesta:
    datos = encuesta.model_dump(exclude_none=True)
    nueva = Encuesta(**datos)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return schemas.Encuesta.model_validate(nueva, from_attributes=True)


def listar_por_estado(db: Session, estado: str) -> List[schemas.Encuesta]:
    estado_enum = _parse_estado(estado)
    stmt = select(Encuesta).where(Encuesta.estado == estado_enum)
    encuestas: Iterable[Encuesta] = db.execute(stmt).scalars().all()
    return [
        schemas.Encuesta.model_validate(item, from_attributes=True)
        for item in encuestas
    ]


def obtener_encuesta(
    db: Session, encuesta_id: int
) -> Optional[schemas.EncuestaDetalle]:
    stmt = (
        select(Encuesta)
        .options(
            selectinload(Encuesta.secciones)
            .selectinload(Seccion.preguntas)
            .selectinload(Pregunta.opciones)
        )
        .where(Encuesta.id == encuesta_id)
    )
    encuesta = db.execute(stmt).scalar_one_or_none()
    if encuesta is None:
        return None
    return schemas.EncuestaDetalle.model_validate(
        encuesta, from_attributes=True
    )


def publicar_encuesta(
    db: Session, encuesta_id: int
) -> Optional[schemas.Encuesta]:
    encuesta = db.get(Encuesta, encuesta_id)
    if encuesta is None:
        return None
    encuesta.estado = EstadoEncuestaEnum.PUBLICADA
    db.commit()
    db.refresh(encuesta)
    return schemas.Encuesta.model_validate(encuesta, from_attributes=True)


def eliminar_encuesta(db: Session, encuesta_id: int) -> bool:
    encuesta = db.get(Encuesta, encuesta_id)
    if encuesta is None:
        return False
    db.delete(encuesta)
    db.commit()
    return True
