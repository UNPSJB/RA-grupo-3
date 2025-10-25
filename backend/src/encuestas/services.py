from typing import List
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload
from src.encuestas import models, schemas
from src.exceptions import NotFound

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

# Devuelve la encuesta con secciones y preguntas
def get_encuesta_completa(db: Session, encuesta_id: int):
    encuesta = db.query(Encuesta)\
        .options(
            joinedload(Encuesta.secciones).joinedload(Seccion.preguntas)
        )\
        .filter(Encuesta.id == encuesta_id)\
        .first()
    
    return encuesta

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
    db.execute(delete(models.Encuesta).where(models.Encuesta.id == plantilla_id))
    db.commit()
    return db_plantilla

#EncuestaInstancia

def activar_encuesta_para_cursada(
    db: Session, 
    data: schemas.EncuestaInstanciaCreate
) -> models.EncuestaInstancia:
    # 1. Verificamos que la cursada exista.
    # 2. Verificamos que la plantilla exista y esté "publicada".
    # 3. Creamos el objeto EncuestaInstancia con los datos.
    # ...
    _instancia = models.EncuestaInstancia(**data.model_dump())
    db.add(_instancia)
    db.commit()
    db.refresh(_instancia)
    return _instancia

def obtener_instancia_activa_por_cursada(
    db: Session, 
    cursada_id: int
) -> models.EncuestaInstancia:
    """
    El servicio que usa el Alumno para ver su encuesta.
    Busca la instancia que esté "ACTIVA" para esa cursada_id.
    """
    stmt = select(models.EncuestaInstancia).where(
        models.EncuestaInstancia.cursada_id == cursada_id,
        models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA
    )
    instancia = db.execute(stmt).scalar_one_or_none()
    if not instancia:
        raise NotFound(detail="No hay encuesta activa para esta cursada.")
    return instancia

