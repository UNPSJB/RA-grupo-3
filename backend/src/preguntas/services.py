from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.enumerados import TipoPreguntaEnum
from src.preguntas import schemas
from src.preguntas.models import Opcion, Pregunta


def crear_pregunta(
    db: Session, payload: schemas.PreguntaCreate
) -> schemas.Pregunta:
    pregunta = Pregunta(
        texto=payload.texto,
        tipo=payload.tipo,
        seccion_id=payload.seccion_id,
    )

    if payload.tipo == TipoPreguntaEnum.MULTIPLE_CHOICE:
        if not payload.opciones:
            raise ValueError(
                "Las preguntas de opción múltiple requieren al menos una opción"
            )
        pregunta.opciones = [
            Opcion(texto=opcion.texto) for opcion in payload.opciones
        ]

    db.add(pregunta)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo crear la pregunta. Verifique que la sección exista."
        ) from exc

    db.refresh(pregunta)
    return schemas.Pregunta.model_validate(pregunta, from_attributes=True)
