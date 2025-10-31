# src/instrumento/router_admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.instrumento import services, schemas 

router = APIRouter(prefix="/admin/instrumentos", tags=["Admin Instrumentos"])

@router.post("/", response_model=schemas.InstrumentoPlantilla)
def crear_instrumento_plantilla(
    plantilla_data: schemas.InstrumentoPlantillaCreate,
    db: Session = Depends(get_db)
):
    # Un solo servicio para crear cualquier tipo
    return services.crear_instrumento_plantilla(db, plantilla_data)
