from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.materia import schemas, services

router = APIRouter(prefix="/materias", tags=["Materias"])

@router.post("/", response_model=schemas.Materia, status_code=status.HTTP_201_CREATED)
def crear_nueva_materia(
    materia_data: schemas.MateriaCreate,
    db: Session = Depends(get_db)
):

    nueva_materia = services.crear_materia(db=db, materia_data=materia_data)
    return nueva_materia
