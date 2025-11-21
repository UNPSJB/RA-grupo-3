from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies import get_current_admin_departamento
from src.persona.models import AdminDepartamento
from src.departamento import services as departamento_services
from src.departamento import schemas as departamento_schemas
from src.exceptions import NotFound
from typing import List, Dict
from src.instrumento import services as instrumento_services
from src.instrumento import schemas as instrumento_schemas

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

@router.post(
    "/instancia/{informe_id}/crear",
    status_code=status.HTTP_201_CREATED
)
def crear_instancia_informe_sintetico(
    informe_id: int,
    departamento_id: int | None = None,  
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    
    #Crea una instancia de informe sintético a partir de la plantilla (informe_id).
    
    try:
        instancia = instrumento_services.crear_instancia_informe_sintetico(db, informe_id, departamento_id)
        return {"instancia_id": instancia.id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/instancia/{instancia_id}/detalles",
    response_model=instrumento_schemas.InstrumentoCompleto
)
def get_detalles_instancia_sintetico(
    instancia_id: int,
    departamento_id: int | None = None,
    db: Session = Depends(get_db)
):
    #Devuelve la plantilla (con secciones y preguntas) asociada a la instancia.
    
    try:
        plantilla = instrumento_services.get_plantilla_para_instancia_sintetico(db, instancia_id, departamento_id)
        return plantilla
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    