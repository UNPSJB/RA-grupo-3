from sqlalchemy.orm import Session
from src.pregunta import models, schemas
from src.exceptions import NotFound 
from src.seccion.models import Seccion


def crear_pregunta(db: Session, pregunta_data: schemas.PreguntaCreate) -> models.Pregunta: # Devuelve el modelo base

    if pregunta_data.seccion_id:
        seccion = db.get(Seccion, pregunta_data.seccion_id) # Asume que Seccion está en models
        if not seccion:
            raise NotFound(f"Sección con id {pregunta_data.seccion_id} no encontrada.")

    if pregunta_data.tipo == models.TipoPregunta.REDACCION:

        if pregunta_data.opciones:
             raise ValueError("Las preguntas de redacción no deben tener opciones.")

        nueva_pregunta = models.PreguntaRedaccion(
            texto=pregunta_data.texto,
            tipo=pregunta_data.tipo, 
            seccion_id=pregunta_data.seccion_id
        )
    elif pregunta_data.tipo == models.TipoPregunta.MULTIPLE_CHOICE:
        if not pregunta_data.opciones or len(pregunta_data.opciones) < 2:
            raise ValueError("Las preguntas Multiple Choice deben tener al menos 2 opciones.")
        nueva_pregunta = models.PreguntaMultipleChoice(
            texto=pregunta_data.texto,
            tipo=pregunta_data.tipo,
            seccion_id=pregunta_data.seccion_id
        )
        opciones_obj = [models.Opcion(texto=o.texto) for o in pregunta_data.opciones if o.texto.strip()]
        if len(opciones_obj) < 2:
             raise ValueError("Las preguntas Multiple Choice deben tener al menos 2 opciones con texto.")
        nueva_pregunta.opciones = opciones_obj

    else:
        raise ValueError(f"Tipo de pregunta no válido: {pregunta_data.tipo}")

    db.add(nueva_pregunta)
    db.commit()

    db.refresh(nueva_pregunta)
    return nueva_pregunta