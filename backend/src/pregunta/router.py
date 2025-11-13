from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.pregunta import schemas
from src.database import get_db
from src.pregunta.services import crear_pregunta
from src.dependencies import get_current_admin_secretaria

router = APIRouter(prefix="/preguntas", tags=["preguntas"],dependencies=[Depends(get_current_admin_secretaria)])

@router.post("/", response_model=schemas.Pregunta, summary="Crear Pregunta") 
def create_pregunta(pregunta: schemas.PreguntaCreate, db: Session = Depends(get_db)):
    db_pregunta = crear_pregunta(db, pregunta)
    return db_pregunta