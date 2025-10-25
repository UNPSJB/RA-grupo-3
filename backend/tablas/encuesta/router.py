from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.database import get_db
from tablas.encuestas import schemas, services

router = APIRouter(prefix="/encuestas", tags=["encuestas"])

# Rutas para encuestas

# Creación de una encuesta
@router.post('/', response_model=schemas.Encuesta)
def crear_encuesta(encuesta: schemas.EncuestaCreate, db: Session = Depends(get_db)):
    return services.crear_encuesta(db, encuesta)

# Get de encuestas
@router.get('/', response_model=list[schemas.EncuestaConPreguntas])
def listar_encuestas(db: Session = Depends(get_db)):
    encuestas = services.listar_encuestas(db)
    return JSONResponse(content=jsonable_encoder(encuestas))
