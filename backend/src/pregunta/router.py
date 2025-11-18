# src/pregunta/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.pregunta import schemas
from src.database import get_db
from src.pregunta.services import crear_pregunta
# --- CAMBIO: Importar el guardia de Secretaria
from src.dependencies import get_current_admin_secretaria

router = APIRouter(
    prefix="/preguntas", 
    tags=["preguntas"],
    # --- CAMBIO: Proteger con el guardia de Secretaria
    dependencies=[Depends(get_current_admin_secretaria)]
)

# ... (Pega el resto de tu ruta @router.post aquí) ...
@router.post("/", response_model=schemas.Pregunta, summary="Crear Pregunta") 
def create_pregunta(pregunta: schemas.PreguntaCreate, db: Session = Depends(get_db)):
    db_pregunta = crear_pregunta(db, pregunta)
    return db_pregunta