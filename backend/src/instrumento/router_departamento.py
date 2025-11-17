from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.instrumento import services, schemas
from src.persona.models import AdminDepartamento
from src.dependencies import get_current_admin_departamento
from src.exceptions import NotFound, BadRequest
from src.encuestas.schemas import InformeSinteticoResultado
from typing import List

router = APIRouter(
    prefix="/departamento", 
    tags=["Departamento - Estadísticas"],
    dependencies=[Depends(get_current_admin_departamento)]
)

@router.post(
    "/informes-sinteticos/generar", 
    response_model=schemas.InstrumentoPlantilla, # Deberíamos crear un schema para InformeSinteticoInstancia
    status_code=status.HTTP_201_CREATED
)
def generar_nuevo_informe_sintetico(
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Inicia la generación de un nuevo Informe Sintético para el departamento
    del administrador logueado.
    Agrupa todos los reportes de profesores (ACI) completados.
    """
    try:
        nuevo_informe = services.crear_informe_sintetico_para_departamento(
            db=db, 
            admin_depto=admin
        )
        # Devolvemos la "plantilla" del informe, pero podríamos devolver el informe_id
        # Para ser consistentes, mejor devolvemos el informe creado.
        # (Necesitaríamos un schema de 'InformeSinteticoInstancia' en 'instrumento/schemas.py')
        
        # Por ahora, devolvemos la plantilla base que usó:
        return nuevo_informe.informe_sintetico 
        
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al generar informe sintético: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al generar el informe."
        )

# --- A FUTURO ---
# @router.get("/informes-sinteticos")
# def listar_informes_sinteticos_generados( ... ):
#     # Aquí irá la lógica para listar los informes ya creados
#     pass

# @router.get("/informes-sinteticos/{informe_id}/estadisticas")
# def obtener_estadisticas_agregadas( ... ):
#     # Aquí irá la lógica para consultar y agregar los datos
#     pass


@router.get(
    "/informes-sinteticos",
    response_model=List[schemas.InformeSinteticoInstanciaList]
)
def listar_informes_sinteticos_generados(
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Lista todos los Informes Sintéticos (agrupaciones) que ya han sido
    generados para el departamento de este administrador.
    """
    try:
        return services.listar_informes_sinteticos_por_departamento(db, admin)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al listar informes: {e}")
        raise HTTPException(status_code=5.00, detail="Error al listar informes.")


@router.get(
    "/informes-sinteticos/{informe_id}/estadisticas",
    response_model=InformeSinteticoResultado
)
def obtener_estadisticas_agregadas(
    informe_id: int,
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Obtiene los resultados estadísticos agregados para un
    Informe Sintético específico.
    """
    try:
        return services.obtener_estadisticas_informe_sintetico(db, informe_id, admin)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al obtener estadísticas: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas.")