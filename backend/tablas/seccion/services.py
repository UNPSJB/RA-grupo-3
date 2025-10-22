from tablas.seccion import schemas
from tablas.seccion.models import Seccion
from sqlalchemy.orm import Session

def crear_seccion(db: Session, seccion: schemas.SeccionCreate) -> schemas.Seccion:
    _seccion= Seccion(
        encuesta_id = seccion.encuesta_id,
        

    )