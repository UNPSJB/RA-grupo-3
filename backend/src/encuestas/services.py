from typing import List
from src.seccion.models import Seccion
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload, joinedload
from src.encuestas import models, schemas
from src.exceptions import NotFound,BadRequest
from src.persona.models import Inscripcion # Necesitas Alumno e Inscripcion
from src.materia.models import Cursada
from datetime import datetime



def crear_plantilla_encuesta(db: Session, plantilla_data: schemas.EncuestaAlumnoPlantillaCreate) -> models.Encuesta:
    _plantilla = models.Encuesta(**plantilla_data.model_dump())
    db.add(_plantilla)
    db.commit()
    db.refresh(_plantilla)
    return _plantilla

def listar_plantillas(db: Session, state: models.EstadoEncuesta = None) -> List[models.Encuesta]:
    stmt = select(models.Encuesta).options(selectinload(models.Encuesta.secciones))
    if state:
        stmt = stmt.filter(models.Encuesta.estado == state)
    return db.execute(stmt).unique().scalars().all()


def obtener_plantilla_por_id(db: Session, plantilla_id: int) -> models.Encuesta:
    plantilla = db.query(models.Encuesta).options(selectinload(models.Encuesta.secciones)).filter(models.Encuesta.id == plantilla_id).first()
    if not plantilla:
        raise NotFound(detail= f"Plantilla de Encuesta con id {plantilla_id} no encontrada")
    return plantilla

def modificar_plantilla(
    db: Session, plantilla_id: int, plantilla_data: schemas.EncuestaAlumnoPlantillaUpdate
) -> models.Encuesta:
    db_plantilla = obtener_plantilla_por_id(db, plantilla_id)
    if db_plantilla.estado == models.EstadoEncuesta.PUBLICADA:
        raise ValueError("No se puede modificar una plantilla de encuesta publicada")

    update_data = plantilla_data.model_dump(exclude_unset=True)
    if update_data:
        db.execute(
            update(models.Encuesta).where(models.Encuesta.id == plantilla_id).values(**update_data)
        )
        db.commit()
        db.refresh(db_plantilla)
    return db_plantilla

def actualizar_estado_plantilla(db: Session, plantilla_id: int, nuevo_estado: models.EstadoEncuesta) -> models.Encuesta:
    plantilla_db = obtener_plantilla_por_id(db, plantilla_id)
    plantilla_db.estado = nuevo_estado
    db.add(plantilla_db)
    db.commit()
    db.refresh(plantilla_db)
    return plantilla_db

def eliminar_plantilla(db: Session, plantilla_id: int) -> models.Encuesta:
    db_plantilla = obtener_plantilla_por_id(db, plantilla_id)
    db.delete(db_plantilla)
    db.commit()
    return db_plantilla

#EncuestaInstancia

def activar_encuesta_para_cursada(db: Session, data: schemas.EncuestaInstanciaCreate) -> models.EncuestaInstancia:
    cursada = db.get(Cursada, data.cursada_id)
    if not cursada:
        raise NotFound(detail=f"Cursada con ID {data.cursada_id} no encontrada.")
    plantilla = db.get(models.Encuesta, data.plantilla_id)
    if not plantilla:
        raise NotFound(detail=f"Plantilla de Encuesta con ID {data.plantilla_id} no encontrada.")
    if plantilla.estado != models.EstadoEncuesta.PUBLICADA:
        raise BadRequest(detail=f"La plantilla de encuesta {data.plantilla_id} no está publicada.")

    stmt_existente = select(models.EncuestaInstancia).where(models.EncuestaInstancia.cursada_id == data.cursada_id)
    instancia_existente = db.execute(stmt_existente).scalar_one_or_none()
    if instancia_existente:
        raise BadRequest(detail=f"Ya existe una instancia de encuesta (ID: {instancia_existente.id}) para la cursada {data.cursada_id}.")
    nueva_instancia = models.EncuestaInstancia(
        cursada_id=data.cursada_id,
        plantilla_id=data.plantilla_id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado=data.estado 
    )
    db.add(nueva_instancia)
    try:
        db.commit()
        db.refresh(nueva_instancia)
    except Exception as e:
        db.rollback()
        print(f"ERROR en commit al activar instancia: {e}")
        raise BadRequest(detail=f"Error al guardar la instancia en la base de datos: {e}")

    return nueva_instancia


def obtener_instancias_activas_alumno(db: Session, alumno_id: int) -> List[models.EncuestaInstancia]:
    now = datetime.now() 
    stmt = (
        select(models.EncuestaInstancia)
        .join(Inscripcion,models.EncuestaInstancia.cursada_id == Inscripcion.cursada_id) 
        .where(
            Inscripcion.alumno_id == alumno_id,
           models.EncuestaInstancia.estado ==models.EstadoInstancia.ACTIVA,
        )
        .options(
            joinedload(models.EncuestaInstancia.plantilla),
            joinedload(models.EncuestaInstancia.cursada) 
            .joinedload(Cursada.materia)
        )
        .distinct() 
    )

    instancias_activas = db.execute(stmt).scalars().all()
    return instancias_activas


def obtener_instancia_activa_por_cursada(db: Session, cursada_id: int) -> models.EncuestaInstancia:
    now = datetime.now()
    stmt = (
        select(models.EncuestaInstancia)
        .where(
            models.EncuestaInstancia.cursada_id == cursada_id,
            models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA,
            models.EncuestaInstancia.fecha_inicio <= now,
            (models.EncuestaInstancia.fecha_fin == None) | (models.EncuestaInstancia.fecha_fin > now)
        )
        .options(selectinload(models.EncuestaInstancia.plantilla))
    )
    instancia = db.execute(stmt).scalar_one_or_none()
    if not instancia:
        raise NotFound(f"No se encontró una encuesta activa para la cursada ID {cursada_id}.")
    return instancia

def obtener_plantilla_para_instancia_activa(db: Session, instancia_id: int) -> models.Encuesta:
    now = datetime.now()
    instancia = db.query(models.EncuestaInstancia)\
        .filter(
            models.EncuestaInstancia.id == instancia_id,
            models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA,
        )\
        .options(
            selectinload(models.EncuestaInstancia.plantilla)
            .selectinload(models.Encuesta.secciones)
            .selectinload(Seccion.preguntas)
        )\
        .first()
    if not instancia:
        raise NotFound(detail=f"No se encontró una encuesta activa con ID de instancia {instancia_id}.")

    if not instancia.plantilla:
         raise Exception(f"La instancia {instancia_id} no tiene una plantilla asociada.")

    return instancia.plantilla
