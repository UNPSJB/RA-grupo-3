from src.preguntas import schemas
from src.preguntas.models import Pregunta, Opcion
from src.preguntas.exceptions import PreguntaNoEncontrada
from sqlalchemy.orm import Session
from src.preguntas.models import Pregunta, Opcion, TipoPregunta


# Crear pregunta
def crear_pregunta(db: Session, pregunta: schemas.PreguntaCreate) -> schemas.Pregunta:
    _pregunta = Pregunta(
        texto=pregunta.texto,
        tipo=TipoPregunta(pregunta.tipo),  
    )

    if pregunta.opciones:
        _pregunta.opciones = [Opcion(texto=o.texto) for o in pregunta.opciones]

    try:
        db.add(_pregunta)
        db.commit()
        db.refresh(_pregunta)
    except Exception as e:
        db.rollback()
        print("Error al crear pregunta:", str(e))
        raise

    return _pregunta


