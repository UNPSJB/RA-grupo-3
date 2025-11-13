from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.seccion import schemas, services
from src.dependencies import get_current_admin_secretaria

router = APIRouter(prefix="/secciones", tags=["secciones"],dependencies=[Depends(get_current_admin_secretaria)])

# Creación de una seccion
@router.post('/', response_model=schemas.Seccion)
def crear_seccion(seccion: schemas.SeccionCreate, db: Session = Depends(get_db)):
    return services.crear_seccion(db, seccion)

@router.get('/', response_model=list[schemas.Seccion])
def listar_secciones(db: Session = Depends(get_db)):
    return services.listar_secciones(db)