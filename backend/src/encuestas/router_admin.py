from fastapi import APIRouter, Depends, HTTPException, status 
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from src.database import get_db
from src.encuestas import schemas, services
from src.exceptions import NotFound, BadRequest
from src.instrumento import services as instrumento_services
from src.encuestas.schemas import GenerarSinteticoResponse, GenerarSinteticoRequest
from typing import List
from src.encuestas.schemas import CerrarEncuestaBody

# --- CAMBIO 1: Importamos AMBOS guardias ---
from src.dependencies import (
    get_current_admin_secretaria, 
    get_current_admin_departamento_o_secretaria
)

router_gestion = APIRouter(
    prefix="/admin/gestion-encuestas", 
    tags=["Admin Encuestas - Instancias"],
    # --- CAMBIO 2: QUITAMOS la dependencia global aquí para no bloquear al Departamento ---
    # dependencies=[Depends(get_current_admin_secretaria)] 
)

# --- Endpoints Exclusivos de SECRETARIA (Les agregamos la dependencia aquí) ---

@router_gestion.post(
    "/activar",
    response_model=schemas.EncuestaInstancia,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_admin_secretaria)] # <--- Solo Secretaria
)
def activar_encuesta_cursada(
    data: schemas.EncuestaInstanciaCreate,
    db: Session = Depends(get_db)
):
    try:
        nueva_instancia = services.activar_encuesta_para_cursada(db, data=data)
        return nueva_instancia
    except NotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BadRequest as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado al activar encuesta: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al activar la encuesta."
        )
    
@router_gestion.patch(
    "/instancia/{instancia_id}/cerrar",
    response_model=schemas.EncuestaInstancia,
    dependencies=[Depends(get_current_admin_secretaria)] # <--- Solo Secretaria
)
def cerrar_encuesta_instancia(
    instancia_id: int,
    body: CerrarEncuestaBody = None,
    db: Session = Depends(get_db)
):
    fecha_fin = body.fecha_fin_informe if body else None
    
    try:
        instancia_cerrada = services.cerrar_instancia_encuesta(
            db, 
            instancia_id=instancia_id, 
            fecha_fin_informe=fecha_fin
        )
        return instancia_cerrada
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BadRequest as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error interno.")

# --- CAMBIO 3: Endpoint Compartido (Secretaria O Departamento) ---

@router_gestion.post(
    "/generar-sintetico",
    response_model=GenerarSinteticoResponse,
    status_code=status.HTTP_201_CREATED,
    # Usamos el nuevo guardia flexible
    dependencies=[Depends(get_current_admin_departamento_o_secretaria)] 
)
def generar_informe_sintetico_departamental(
    request_data: GenerarSinteticoRequest,
    db: Session = Depends(get_db)
):
    try:
        nueva_instancia = instrumento_services.generar_informe_sintetico_para_departamento(
            db=db,
            departamento_id=request_data.departamento_id,
            fecha_fin_informe=request_data.fecha_fin_informe 
        )
        
        return GenerarSinteticoResponse(
            instancia_id=nueva_instancia.id,
            departamento_id=nueva_instancia.departamento_id,
            cantidad_informes=len(nueva_instancia.actividades_curriculares_instancia)
        )

    except (BadRequest, NotFound) as e:
        raise HTTPException(status_code=e.STATUS_CODE, detail=e.DETAIL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")



@router_gestion.get(
    "/cursadas-disponibles", 
    response_model=List[schemas.CursadaAdminList],
    dependencies=[Depends(get_current_admin_secretaria)] 
)
def get_cursadas_para_activar(db: Session = Depends(get_db)):
    return services.listar_cursadas_sin_encuesta(db)

@router_gestion.get(
    "/activas", 
    response_model=List[schemas.EncuestaActivaAdminList],
    dependencies=[Depends(get_current_admin_secretaria)] 
)
def get_encuestas_activas_admin(db: Session = Depends(get_db)):
    return services.listar_todas_instancias_activas(db)

@router_gestion.get(
    "/departamentos", 
    response_model=List[schemas.DepartamentoSimple],
    dependencies=[Depends(get_current_admin_secretaria)] 
)
def get_lista_departamentos(db: Session = Depends(get_db)):
    return services.listar_todos_departamentos(db)


@router_gestion.post("/activar-masivo", status_code=status.HTTP_201_CREATED)
def activar_encuestas_masivo(
    data: schemas.ActivacionMasivaRequest,
    db: Session = Depends(get_db)
):
    try:
        return services.activar_periodo_masivo(db, data)
    except Exception as e:
        print(f"Error activando masivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))