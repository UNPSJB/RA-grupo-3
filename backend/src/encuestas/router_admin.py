# src/encuestas/router_admin.py

from fastapi import APIRouter, Depends, HTTPException, status # Importa status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import models, schemas, services

from src.exceptions import NotFound

router = APIRouter(prefix="/admin/plantillas-encuesta", tags=["Admin Encuestas - Plantillas"])


@router.post('/', response_model=schemas.EncuestaAlumnoPlantilla) #
def crear_plantilla_encuesta(
    plantilla_data: schemas.EncuestaAlumnoPlantillaCreate,
    db: Session = Depends(get_db)
):
    return services.crear_plantilla_encuesta(db, plantilla_data)


@router.get('/borradores', response_model=list[schemas.EncuestaAlumnoPlantilla])
def listar_plantillas_borrador(db: Session = Depends(get_db)): 
    plantillas = services.listar_plantillas(db, models.EstadoEncuesta.BORRADOR)
    return plantillas 


@router.get('/publicadas', response_model=list[schemas.EncuestaAlumnoPlantilla])
def listar_plantillas_publicadas(db: Session = Depends(get_db)): 
    plantillas = services.listar_plantillas(db, models.EstadoEncuesta.PUBLICADA)
    return plantillas


@router.get("/{plantilla_id}", response_model=schemas.EncuestaAlumnoPlantilla) 
def leer_plantilla( 
    plantilla_id: int, db: Session = Depends(get_db) 
):
    try:
        return services.obtener_plantilla_por_id(db, plantilla_id) 
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{plantilla_id}", response_model=schemas.EncuestaAlumnoPlantilla)
def modificar_plantilla( 
    plantilla_id: int, plantilla_data: schemas.EncuestaAlumnoPlantillaUpdate, db: Session = Depends(get_db)
):
    try:
        return services.modificar_plantilla(db, plantilla_id, plantilla_data) 
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{plantilla_id}/publicar", response_model=schemas.EncuestaAlumnoPlantilla) 
def publicar_plantilla( 
    plantilla_id: int, db: Session = Depends(get_db) 
):
    try:
        return services.actualizar_estado_plantilla(db, plantilla_id, models.EstadoEncuesta.PUBLICADA) 
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{plantilla_id}", response_model=schemas.EncuestaAlumnoPlantilla) 
def eliminar_plantilla(plantilla_id: int, db: Session = Depends(get_db)): 
    try:
        return services.eliminar_plantilla(db, plantilla_id) 
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))