from typing import List
from sqlalchemy import select
from src.seccion import schemas
from sqlalchemy.orm import Session
from src.seccion.models import Seccion

# Crear sección
def crear_seccion(db: Session, seccion: schemas.SeccionCreate):
    _seccion = Seccion(
        **seccion.model_dump()
    )

    db.add(_seccion)
    db.commit()
    db.refresh(_seccion)
    return _seccion

def listar_secciones(db: Session) -> List[Seccion]:
    return db.execute(select(Seccion)).scalars().all()