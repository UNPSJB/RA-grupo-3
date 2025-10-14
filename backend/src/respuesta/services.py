from sqlalchemy.orm import Session
from src.respuesta.models import Respuesta

def crear_respuestas_batch(db: Session, respuestas_data: list[dict]):
    """
    Crea varias respuestas de una encuesta en una sola operación.
    """
    respuestas_creadas = []
    for data in respuestas_data:
        nueva_respuesta = Respuesta(**data)
        db.add(nueva_respuesta)
        respuestas_creadas.append(nueva_respuesta)

    db.commit()

    # Refresca los objetos para obtener sus IDs y timestamps
    for r in respuestas_creadas:
        db.refresh(r)

    return respuestas_creadas
