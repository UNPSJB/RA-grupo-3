from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas, services

router = APIRouter(prefix="/encuestas", tags=["encuestas"])

# Rutas para encuestas

# Creación de una encuesta
@router.post('/', response_model=schemas.Encuesta)
def crear_encuesta(encuesta: schemas.EncuestaCreate, db: Session = Depends(get_db)):
    return services.crear_encuesta(db, encuesta)

# Get de encuestas
@router.get('/', response_model=list[schemas.EncuestaConPreguntas])
def listar_encuestas(anio: int | None = None, db: Session = Depends(get_db)):
    if anio is not None and (anio < 1 or anio > 5):
        raise HTTPException(
            status_code=400,
            detail="El año de la carrera debe estar entre 1 (primero) y 5 (quinto).",
        )

    encuestas = services.listar_encuestas(db, anio=anio)
    return JSONResponse(content=jsonable_encoder(encuestas))
