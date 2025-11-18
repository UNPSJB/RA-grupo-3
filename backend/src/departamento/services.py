from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from src.materia.models import Cursada, Materia, Carrera, Departamento, carrera_materia_association
from src.instrumento.models import ActividadCurricularInstancia
from src.persona.models import Profesor
from . import schemas # Import relativo
from typing import List

from src.enumerados import EstadoInforme


def get_informes_curriculares_por_departamento(
    db: Session, departamento_id: int
) -> List[schemas.InformeCurricularStatus]:
    
    # 1. La consulta une toda la información necesaria
    stmt = (
        select(ActividadCurricularInstancia)
        # Unimos ActividadCurricularInstancia -> Cursada
        .join(ActividadCurricularInstancia.cursada)
        # Cursada -> Materia
        .join(Cursada.materia)
        # Materia -> Tabla de Asociación -> Carrera
        .join(Materia.carreras)
        # Filtramos por el ID del departamento
        .where(Carrera.departamento_id == departamento_id)
        
        # --- ESTA ES LA LÍNEA NUEVA ---
        # Filtramos solo los que están "COMPLETADO"
        .where(ActividadCurricularInstancia.estado == EstadoInforme.COMPLETADO)
        # --- FIN LÍNEA NUEVA ---

        # Cargamos los datos relacionados para evitar N+1 queries
        .options(
            joinedload(ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.materia),
            joinedload(ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.profesor),
            joinedload(ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.cuatrimestre),
        )
        .distinct()
    )
    
    instancias = db.scalars(stmt).all()
    
    # 2. Mapeamos los resultados al Schema que definimos
    resultados = []
    for inst in instancias:
        # Chequeo de seguridad por si faltan datos
        if not inst.cursada or not inst.cursada.materia or not inst.cursada.profesor:
            continue
            
        cuatri = inst.cursada.cuatrimestre
        cuatri_info = f"{cuatri.anio} - {cuatri.periodo.value}" if cuatri and cuatri.anio and cuatri.periodo else "N/A"
        
        resultados.append(
            schemas.InformeCurricularStatus(
                id=inst.id,
                estado=inst.estado,
                materia_nombre=inst.cursada.materia.nombre,
                profesor_nombre=inst.cursada.profesor.nombre,
                cuatrimestre_info=cuatri_info
            )
        )
    
    return resultados