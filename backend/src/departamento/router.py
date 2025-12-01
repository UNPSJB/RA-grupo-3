from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from src.database import get_db
from src.dependencies import get_current_admin_departamento
from src.persona.models import AdminDepartamento
from src.departamento import services as departamento_services
from src.departamento import schemas as departamento_schemas
from src.exceptions import NotFound
from typing import List, Dict
from src.instrumento import services as instrumento_services
from src.instrumento import schemas as instrumento_schemas
from src.instrumento import models as instrumento_models
from src.materia import models as materia_models 
from src.persona import models as persona_models
from src.respuesta.schemas import RespuestaSetCreate
from src.exceptions import BadRequest, PermissionDenied
from src.respuesta import services as respuesta_services


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


@router.get(
    "/instancia/{instancia_id}/detalles",
    response_model=instrumento_schemas.InstrumentoCompleto
)
def get_detalles_instancia_sintetico(
    instancia_id: int,
    departamento_id: int | None = None,
    db: Session = Depends(get_db)
):
    try:
        # 1. Usamos la función existente para obtener la plantilla
        plantilla = instrumento_services.get_plantilla_para_instancia_sintetico(db, instancia_id, departamento_id)
        
        # 2. Buscamos la instancia sintética con los JOINS
        instancia_sintetica = db.query(instrumento_models.InformeSinteticoInstancia).options(
            joinedload(instrumento_models.InformeSinteticoInstancia.actividades_curriculares_instancia)
            .joinedload(instrumento_models.ActividadCurricularInstancia.cursada) 
            .joinedload(materia_models.Cursada.materia), 
            
            joinedload(instrumento_models.InformeSinteticoInstancia.actividades_curriculares_instancia)
            .joinedload(instrumento_models.ActividadCurricularInstancia.profesor),

            # Agregamos carga de cuatrimestre para evitar problemas
            joinedload(instrumento_models.InformeSinteticoInstancia.actividades_curriculares_instancia)
            .joinedload(instrumento_models.ActividadCurricularInstancia.cursada)
            .joinedload(materia_models.Cursada.cuatrimestre)
        ).filter(instrumento_models.InformeSinteticoInstancia.id == instancia_id).first()

        # 3. Mapeamos los datos
        lista_informes = []
        if instancia_sintetica and instancia_sintetica.actividades_curriculares_instancia:
            for ac in instancia_sintetica.actividades_curriculares_instancia:
                mat_nom = ac.cursada.materia.nombre if ac.cursada and ac.cursada.materia else "Desconocida"
                prof_nom = ac.profesor.nombre if ac.profesor else "Desconocido"
                
                # Construcción segura del cuatrimestre
                cuatri = "N/A"
                if ac.cursada and ac.cursada.cuatrimestre:
                    anio = ac.cursada.cuatrimestre.anio
                    # Manejo seguro del Enum
                    periodo = ac.cursada.cuatrimestre.periodo
                    periodo_str = periodo.value if hasattr(periodo, 'value') else str(periodo)
                    cuatri = f"{anio} - {periodo_str}"


                lista_informes.append({
                    "id": ac.id,
                    "materia_nombre": mat_nom,
                    "profesor_nombre": prof_nom,
                    "cuatrimestre_info": str(cuatri),
                    "equipamiento": "", 
                    "bibliografia": "", 
                    # --- CORRECCIÓN AQUÍ ---
                    "estado": ac.estado.value  # Agregamos .value para pasar el string "resumido"
                    # -----------------------
                })

        # 4. Retorno
        respuesta = instrumento_schemas.InstrumentoCompleto.model_validate(plantilla)
        respuesta.informes_curriculares_asociados = lista_informes
        
        return respuesta

    except Exception as e:
        print(f"Error detallado al obtener detalles: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    
@router.post(
    "/instancia/{instancia_id}/responder",
    status_code=status.HTTP_201_CREATED
)
def responder_informe_sintetico(
    instancia_id: int,
    respuestas_data: RespuestaSetCreate,
    db: Session = Depends(get_db),
    current_user: AdminDepartamento = Depends(get_current_admin_departamento)
):
    
    # Validar que el usuario tenga un departamento asignado (por seguridad)
    if not current_user.departamento_id:
        raise HTTPException(status_code=403, detail="El usuario no tiene un departamento asignado.")

    try:
        # Llamamos al servicio pasando el ID del departamento del usuario
        respuesta_services.crear_submission_departamento(
            db=db,
            instancia_id=instancia_id,
            departamento_id=current_user.departamento_id, 
            respuestas_data=respuestas_data
        )
        return {"message": "Informe Sintético completado exitosamente."}
        
    except (BadRequest, NotFound, PermissionDenied) as e: # Capturar excepciones de servicio
        status_code = getattr(e, "status_code", 400) # Fallback a 400
        if isinstance(e, NotFound): status_code = 404
        if isinstance(e, PermissionDenied): status_code = 403
        
        raise HTTPException(status_code=status_code, detail=str(e))
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar el informe.")