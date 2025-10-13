from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.respuesta.schemas import EncuestaRespuestaCreate, RespuestaResponse
from src.respuesta.services import crear_respuestas_batch

router = APIRouter(prefix="/respuestas", tags=["Respuestas"])

@router.post("/", response_model=list[RespuestaResponse])
def crear_respuestas_endpoint(
    datos: EncuestaRespuestaCreate,
    db: Session = Depends(get_db)
):
    # Crea todas las respuestas de una encuesta en una sola petición.
    
    respuestas_creadas = crear_respuestas_batch(db, [r.dict() for r in datos.respuestas])
    return respuestas_creadas
