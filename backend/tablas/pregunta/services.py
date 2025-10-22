from tablas.pregunta import schemas
from tablas.pregunta.models import Pregunta, Opcion
from tablas.pregunta.exceptions import PreguntaNoEncontrada
from sqlalchemy.orm import Session
from tablas.pregunta.models import TipoPregunta


# Crear pregunta
def crear_pregunta(db: Session, pregunta: schemas.PreguntaCreate) -> schemas.Pregunta:
    # Creamos el objeto Pregunta
    _pregunta = Pregunta(
        texto=pregunta.texto,
        tipo=TipoPregunta(pregunta.tipo),
        encuesta_id= pregunta.encuesta_id
    )

    # Si es multiple choice, agregamos las opciones
    if pregunta.opciones:
        _pregunta.opciones = [Opcion(texto=o.texto) for o in pregunta.opciones]

    db.add(_pregunta)
    db.commit()
    db.refresh(_pregunta)
    return _pregunta

