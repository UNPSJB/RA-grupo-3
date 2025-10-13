from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.pregunta import schemas
from src.database import get_db
from src.pregunta.services import crear_pregunta 

router = APIRouter(prefix="/preguntas", tags=["preguntas"])

@router.post("/", response_model=schemas.Pregunta, summary="Crear Pregunta")
def create_pregunta(pregunta: schemas.PreguntaCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva pregunta con sus opciones (si es multiple choice)
    """
    return crear_pregunta(db, pregunta)

