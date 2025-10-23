from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.secciones import schemas
from src.secciones.models import Seccion


def crear_seccion(
    db: Session, payload: schemas.SeccionCreate
) -> schemas.Seccion:
    seccion = Seccion(
        nombre=payload.nombre,
        encuesta_id=payload.encuesta_id,
    )
    db.add(seccion)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo crear la sección. Verifique que la encuesta exista."
        ) from exc
    db.refresh(seccion)
    return schemas.Seccion.model_validate(seccion, from_attributes=True)
