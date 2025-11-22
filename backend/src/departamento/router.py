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
        
        # 2. Buscamos la instancia sintética con los JOINS, usando los alias de modelos correctos
        instancia_sintetica = db.query(instrumento_models.InformeSinteticoInstancia).options(
            # Cargamos Actividades Curriculares
            joinedload(instrumento_models.InformeSinteticoInstancia.actividades_curriculares_instancia)
            # Cargamos Cursada (materia_models.Cursada, pero como está ya dentro de la relación, usamos el modelo de la relación)
            .joinedload(instrumento_models.ActividadCurricularInstancia.cursada) 
            # Cargamos Materia (a través de Cursada)
            .joinedload(materia_models.Cursada.materia), # <--- ACCESO CLARO a la relación Cursada.materia
            
            # Cargamos Profesor (a través de ActividadCurricularInstancia)
            joinedload(instrumento_models.InformeSinteticoInstancia.actividades_curriculares_instancia)
            .joinedload(instrumento_models.ActividadCurricularInstancia.profesor) 
        ).filter(instrumento_models.InformeSinteticoInstancia.id == instancia_id).first()

        # 3. Mapeamos los datos para el schema simple
        lista_informes = []
        if instancia_sintetica and instancia_sintetica.actividades_curriculares_instancia:
            for ac in instancia_sintetica.actividades_curriculares_instancia:
                # Acceso a Materia
                mat_nom = ac.cursada.materia.nombre if ac.cursada and ac.cursada.materia else "Desconocida"
                
                # Acceso a Profesor (El modelo Profesor tiene el campo 'nombre')
                # Asumimos que quieres 'nombre' o que la combinación de nombre/apellido es el campo 'nombre'.
                # Si usas un campo combinado como 'nombre_completo', ajusta aquí.
                prof_nom = ac.profesor.nombre if ac.profesor else "Desconocido"
                
                # Acceso a Cuatrimestre
                # El campo cuatrimestre_id se relaciona con Cuatrimestre. El dato es el año y el periodo.
                # Asumimos que tienes una propiedad calculada o un campo que combina año y periodo. 
                # Si el campo existe en el ORM Cursada:
                # cuatri = ac.cursada.cuatrimestre_info if ac.cursada and hasattr(ac.cursada, 'cuatrimestre_info') else "N/A"
                # Si el campo se construye a partir de la relación Cuatrimestre:
                cuatri = f"{ac.cursada.cuatrimestre.anio} - {ac.cursada.cuatrimestre.periodo.value}" if ac.cursada and ac.cursada.cuatrimestre else "N/A"


                lista_informes.append({
                    "id": ac.id,
                    "materia_nombre": mat_nom,
                    "profesor_nombre": prof_nom,
                    "cuatrimestre_info": str(cuatri),
                    "equipamiento": getattr(ac, 'equipamiento', None),
                    "bibliografia": getattr(ac, 'bibliografia', None),
                    "estado": ac.estado
                })

        # 4. Combinar y devolver la respuesta
        respuesta = instrumento_schemas.InstrumentoCompleto.model_validate(plantilla)
        respuesta.informes_curriculares_asociados = lista_informes
        
        return respuesta

    except HTTPException as e:
        raise e
    except Exception as e:
        # Imprime el error detallado para facilitar la depuración
        print(f"Error detallado: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo detalles: {str(e)}")