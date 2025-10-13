from typing import List, Optional
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload
from src.encuestas.models import Encuesta
from src.encuestas import schemas,models
from src.exceptions import NotFound


def crear_encuesta(db: Session, encuesta: schemas.EncuestaCreate) -> schemas.Encuesta:
    _encuesta = Encuesta(**encuesta.model_dump())
    db.add(_encuesta)
    db.commit()
    db.refresh(_encuesta)
    return _encuesta

def listar_encuestas(db: Session, state: schemas.EstadoEncuesta = None) -> List[Encuesta]:
    stmt = (
        select(Encuesta)
        .options(selectinload(Encuesta.preguntas))
        .filter(Encuesta.estado == state.value) 
    )
    return db.execute(stmt).unique().scalars().all()

def obtener_encuesta_por_id(db: Session, encuesta_id: int):
    encuesta = db.query(Encuesta).options(selectinload(Encuesta.preguntas)).filter(Encuesta.id == encuesta_id).first()
    if not encuesta:
        raise NotFound(detail= f"Encuesta con id {encuesta_id} no encontrada")
    
    return encuesta

def modificar_encuesta(
    db: Session, encuesta_id: int, encuesta: schemas.EncuestaUpdate
) -> Encuesta:
    db_encuesta = obtener_encuesta_por_id(db, encuesta_id)
    db.execute(
        update(Encuesta).where(Encuesta.id == encuesta_id).values(**encuesta.model_dump(exclude_unset=True))
    )
    #solo se puede modificar si esta en borrador
    if db_encuesta.estado == "publicada":
        raise ValueError("No se puede modificar una encuesta publicada")
    
    db.commit()
    db.refresh(db_encuesta)
    return db_encuesta

def actualizar_estado_encuesta(db: Session, encuesta_id: int, nuevo_estado: models.EstadoEncuesta):
    encuesta_db = obtener_encuesta_por_id(db, encuesta_id)

    
    encuesta_db.estado = nuevo_estado.value 

    db.add(encuesta_db) 
    db.commit()
       
    db.refresh(encuesta_db)

    return encuesta_db

def eliminar_encuesta(db: Session, encuesta_id: int)-> schemas.Encuesta:
    db_encuesta = obtener_encuesta_por_id(db,encuesta_id)
    db.execute(delete(Encuesta).where(Encuesta.id == encuesta_id))
    db.commit()
    return db_encuesta
