from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies import get_current_admin_departamento
from src.persona.models import AdminDepartamento
from src.departamento import services as departamento_services
from src.departamento import schemas as departamento_schemas
from src.exceptions import NotFound
from typing import List

router = APIRouter(
    prefix="/departamento", 
    tags=["Departamento"],
    dependencies=[Depends(get_current_admin_departamento)]
)

@router.get(
    "/mis-informes-curriculares",
    response_model=List[departamento_schemas.InformeCurricularStatus]
)
def listar_mis_informes_curriculares(
    db: Session = Depends(get_db),
    current_user: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Obtiene todos los informes curriculares (completados y pendientes)
    de las materias que pertenecen al departamento del admin logueado.
    """
    if not current_user.departamento_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario Admin de Departamento no está asociado a ningún departamento."
        )
        
    try:
        resultados = departamento_services.get_informes_curriculares_por_departamento(
            db=db,
            departamento_id=current_user.departamento_id
        )
        return resultados
    except Exception as e:
        print(f"Error al listar informes para depto {current_user.departamento_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")
