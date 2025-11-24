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
from src.encuestas.schemas import GenerarSinteticoResponse
import collections
from src.encuestas.schemas import DashboardDepartamentoStats 



router = APIRouter(
    prefix="/departamento", 
    tags=["Departamento - Estadísticas"],
    dependencies=[Depends(get_current_admin_departamento)]
)

@router.post(
    "/informes-sinteticos/generar", 
    response_model=GenerarSinteticoResponse, 
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
        return GenerarSinteticoResponse(
        instancia_id=nuevo_informe.id,
        departamento_id=nuevo_informe.departamento_id or 0,
        cantidad_informes=len(nuevo_informe.actividades_curriculares_instancia)
    )
        
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error inesperado al generar informe sintético: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al generar el informe."
        )



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
    

@router.get(
    "/instancia/{instancia_id}/autocompletar",
    response_model=schemas.ResumenResponse
)
def autocompletar_seccion(
    instancia_id: int,
    seccion_prefijo: str, # Ej: "1.", "2.A", "3."
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Endpoint usado por el botón 'Traer Respuestas'.
    Agrega las respuestas de los informes base para una sección dada.
    """
    
    try:
        texto = services.generar_resumen_por_seccion(db, instancia_id, seccion_prefijo)
        return {"texto_resumen": texto}
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error autocompletando: {e}")
        raise HTTPException(status_code=500, detail="Error interno generando el resumen.")
    


@router.get(
    "/estadisticas-generales",
    response_model=DashboardDepartamentoStats
)
def get_dashboard_general_departamento(
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Devuelve indicadores clave de gestión para el dashboard del departamento:
    - Cumplimiento de entrega de informes.
    - Gráfico de cobertura curricular (Planificación vs Realidad).
    - Últimas necesidades de equipamiento reportadas.
    """
    try:
        return services.obtener_dashboard_departamento(db, admin)
    except Exception as e:
        print(f"Error generando dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error al calcular estadísticas del departamento.")
    
@router.get(
    "/informes-sinteticos/{informe_id}/exportar-completo",
    response_model=schemas.InformeRespondido
)
def descargar_informe_completo(
    informe_id: int,
    db: Session = Depends(get_db),
    admin: AdminDepartamento = Depends(get_current_admin_departamento)
):
    """
    Devuelve el contenido textual completo del informe para generar PDF.
    """
    try:
        return services.obtener_informe_sintetico_respondido(db, informe_id, admin)
    except (NotFound, BadRequest) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        print(f"Error exportando informe: {e}")
        raise HTTPException(status_code=500, detail="Error al exportar el informe.")