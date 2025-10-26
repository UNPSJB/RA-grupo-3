from sqlalchemy.orm import Session
from src.materia import models, schemas 

def crear_materia(db: Session, materia_data: schemas.MateriaCreate) -> models.Materia:
    nueva_materia = models.Materia(**materia_data.model_dump())
    db.add(nueva_materia)
    db.commit()
    db.refresh(nueva_materia) 
    return nueva_materia

