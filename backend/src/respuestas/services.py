from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.respuestas import schemas
from src.respuestas.models import Respuesta


def crear_respuesta(
    db: Session, payload: schemas.RespuestaCreate
) -> schemas.Respuesta:
    respuesta = Respuesta(
        pregunta_id=payload.pregunta_id,
        texto=payload.texto_respuesta,
        opcion_id=payload.opcion_seleccionada_id,
    )
    db.add(respuesta)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo registrar la respuesta. Verifique los datos enviados."
        ) from exc
    db.refresh(respuesta)
    return schemas.Respuesta.model_validate(respuesta, from_attributes=True)
