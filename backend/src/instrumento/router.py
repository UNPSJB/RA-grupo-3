# src/instrumento/router_admin.py
from fastapi import APIRouter, Depends,  HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.instrumento import services, schemas
from src.enumerados import EstadoInstrumento 
from typing import List


router = APIRouter(prefix="/admin/instrumentos", tags=["Admin Instrumentos"])

@router.post("/", response_model=schemas.InstrumentoPlantilla)
def crear_instrumento_plantilla(
    plantilla_data: schemas.InstrumentoPlantillaCreate,
    db: Session = Depends(get_db)
):
    return services.crear_instrumento_plantilla(db, plantilla_data)

@router.get(
    "/borradores", 
    response_model=List[schemas.InstrumentoPlantilla]
)
def listar_plantillas_borrador(db: Session = Depends(get_db)):
    return services.listar_plantillas_por_estado(
        db, estado=EstadoInstrumento.BORRADOR
    )

@router.get(
    "/publicadas", 
    response_model=List[schemas.InstrumentoPlantilla]
)
def listar_plantillas_publicadas(db: Session = Depends(get_db)):
    return services.listar_plantillas_por_estado(
        db, estado=EstadoInstrumento.PUBLICADA
    )

@router.patch(
    "/{plantilla_id}/publicar", 
    response_model=schemas.InstrumentoPlantilla
)
def publicar_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    try:
        return services.publicar_plantilla(db, plantilla_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/{plantilla_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    try:
        services.eliminar_plantilla(db, plantilla_id)
        return {"detail": "Plantilla eliminada"} 
    except HTTPException as e:
        raise e


@router.get(
    "/{plantilla_id}", 
    response_model=schemas.InstrumentoPlantilla
)
def get_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    plantilla = services.get_plantilla_por_id(db, plantilla_id)
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return plantilla

@router.put(
    "/{plantilla_id}", 
    response_model=schemas.InstrumentoPlantilla
)
def actualizar_plantilla(
    plantilla_id: int,
    plantilla_data: schemas.InstrumentoPlantillaUpdate,
    db: Session = Depends(get_db)
):
    try:
        return services.actualizar_plantilla(db, plantilla_id, plantilla_data)
    except HTTPException as e:
        raise e