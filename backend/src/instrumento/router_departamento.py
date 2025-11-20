from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.instrumento import services, schemas
from src.persona.models import AdminDepartamento
from src.dependencies import get_current_admin_departamento
from src.exceptions import NotFound, BadRequest
from src.encuestas.schemas import InformeSinteticoResultado, ResultadoCursada
from typing import List
from src.encuestas import services as encuestas_services 
from src.persona import schemas as persona_schemas       
from src.materia import schemas as materia_schemas


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
    
@router.get(
    "/profesores",
    response_model=List[persona_schemas.Profesor]
)   
def listar_profesores_del_departamento(
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Lista todos los profesores que han impartido cursadas 
    en el departamento del admin.
    """
    try:
        # (Esta función la crearemos en el paso 1.2)
        return encuestas_services.listar_profesores_por_departamento(db, admin.departamento_id)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al listar profesores: {e}")
        raise HTTPException(status_code=500, detail="Error al listar profesores.")

@router.get(
    "/materias",
    response_model=List[materia_schemas.Materia]
)
def listar_materias_del_departamento(
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Lista todas las materias asignadas a carreras 
    dentro del departamento del admin.
    """
    try:
        return encuestas_services.listar_materias_por_departamento(db, admin.departamento_id)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al listar materias: {e}")
        raise HTTPException(status_code=500, detail="Error al listar materias.")
    

@router.get(
    "/estadisticas/profesor/{profesor_id}",
    response_model=List[ResultadoCursada]
)
def get_estadisticas_por_profesor(
    profesor_id: int,
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Obtiene todas las estadísticas de encuestas cerradas para un
    profesor específico, validando que pertenezca al dpto.
    """
    try:
        # (Esta función la crearemos en el paso 1.4)
        return encuestas_services.obtener_resultados_agregados_para_profesor(db, profesor_id, admin.departamento_id)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al obtener stats por profesor: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas.")

@router.get(
    "/estadisticas/materia/{materia_id}",
    response_model=List[ResultadoCursada]
)
def get_estadisticas_por_materia(
    materia_id: int,
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Obtiene todas las estadísticas de encuestas cerradas para una
    materia específica, validando que pertenezca al dpto.
    """
    try:
        # (Esta función la crearemos en el paso 1.4)
        return encuestas_services.obtener_resultados_agregados_para_materia(db, materia_id, admin.departamento_id)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al obtener stats por materia: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas.")