from typing import List, Optional
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload
from src.encuestas.models import Encuesta
from src.encuestas import schemas

def crear_encuesta(db: Session, encuesta: schemas.EncuestaCreate) -> schemas.Encuesta:
    _encuesta = Encuesta(**encuesta.model_dump())
    db.add(_encuesta)
    db.commit()
    db.refresh(_encuesta)
    return _encuesta

def listar_encuestas(db: Session, anio: Optional[int] = None) -> List[Encuesta]:
    stmt = select(Encuesta).options(selectinload(Encuesta.preguntas))
    if anio is not None:
        stmt = stmt.where(Encuesta.anio_carrera == anio)
    return db.execute(stmt).unique().scalars().all()
