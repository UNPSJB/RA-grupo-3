from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from src.database import get_db
from src.encuestas import models, schemas, services
from src.encuestas.models import Encuesta
from src.seccion.models import Seccion
from src.pregunta.models import Pregunta

router = APIRouter(prefix="/encuestas", tags=["encuestas"])

# Rutas para encuestas

# Creación de una encuesta
@router.post('/', response_model=schemas.Encuesta)
def crear_encuesta(
    encuesta: schemas.EncuestaCreate, db: Session = Depends(get_db)
):
    return services.crear_encuesta(db, encuesta)

# Get de encuestas
@router.get('/borradores', response_model=list[schemas.EncuestaConPreguntas])
def listar_encuestas_borrador(db: Session = Depends(get_db)):
    encuestas = services.listar_encuestas(db, models.EstadoEncuesta.BORRADOR)
    return JSONResponse(content=jsonable_encoder(encuestas))

@router.get('/publicadas', response_model=list[schemas.EncuestaConPreguntas])
def listar_encuestas_publicadas(db: Session = Depends(get_db)):
    encuestas = services.listar_encuestas(db, models.EstadoEncuesta.PUBLICADA)
    return JSONResponse(content=jsonable_encoder(encuestas))


@router.get("/{encuesta_id}",response_model=schemas.Encuesta)
def leer_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
):
    return services.obtener_encuesta_por_id(db,encuesta_id)

# endpoint para obtener una encuesta completa
@router.get("/{encuesta_id}/completa", response_model=schemas.EncuestaConPreguntas)
def obtener_encuesta_completa(
    encuesta_id: int, 
    db: Session = Depends(get_db)
):
    encuesta = services.get_encuesta_completa(db, encuesta_id)
    
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    
    return encuesta

@router.put("/{encuesta_id}", response_model=schemas.Encuesta)
def modificar_encuesta(
    encuesta_id: int, encuesta: schemas.EncuestaUpdate , db: Session = Depends(get_db)
):
    return services.modificar_encuesta(db, encuesta_id, encuesta)

@router.patch("/{encuesta_id}/publicar", response_model=schemas.Encuesta)
def publicar_encuesta(
    encuesta_id: int, db: Session = Depends(get_db)
):
    
    return services.actualizar_estado_encuesta(db, encuesta_id, models.EstadoEncuesta.PUBLICADA)


@router.delete("/{encuesta_id}",response_model=schemas.Encuesta)
def eliminar_encuesta(encuesta_id: int, db: Session = Depends(get_db)):
    return services.eliminar_encuesta(db, encuesta_id)

