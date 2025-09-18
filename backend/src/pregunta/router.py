from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.pregunta import schemas, services

router = APIRouter(prefix="/pregunta", tags=["pregunta"])

# Rutas para pregunta

# Creación de una pregunta
@router.post('/', response_model=schemas.Pregunta)
def crear_encuesta(encuesta: schemas.PreguntaCreate, db: Session = Depends(get_db)):
    return services.crear_pregunta(db, encuesta)

