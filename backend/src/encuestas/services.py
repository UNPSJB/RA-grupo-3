from typing import List
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

def listar_encuestas(db: Session) -> List[Encuesta]:
    stmt = select(Encuesta).options(selectinload(Encuesta.preguntas))
    return db.execute(stmt).unique().scalars().all()
