from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.preguntas import schemas
from src.database import get_db
from src.preguntas.services import crear_pregunta 

router = APIRouter()

@router.post("/", response_model=schemas.Pregunta)
def create_pregunta(pregunta: schemas.PreguntaCreate, db: Session = Depends(get_db)):
    return crear_pregunta(db, pregunta)
