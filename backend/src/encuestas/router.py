from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas, services

router = APIRouter(prefix="/encuestas", tags=["encuestas"])

# Rutas para encuestas

# Creación de una encuesta
@router.post('/', response_model=schemas.Encuesta)
def crear_encuesta(encuesta: schemas.EncuestaCreate, db: Session = Depends(get_db)):
    return services.crear_encuesta(db, encuesta)

@router.get('/', response_model=list[schemas.Encuesta])
def listar_encuestas(db: Session = Depends(get_db)):
    return services.listar_encuestas(db)