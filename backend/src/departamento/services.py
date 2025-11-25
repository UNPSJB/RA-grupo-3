from datetime import datetime
from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

# --- CORRECCIÓN: Agregamos Cuatrimestre al import ---
from src.materia.models import (
    Cursada, 
    Materia, 
    Carrera, 
    Departamento, 
    carrera_materia_association,
    Cuatrimestre  # <--- Faltaba esto
)
from src.instrumento.models import ActividadCurricularInstancia
from src.persona.models import Profesor
from . import schemas 
from src.enumerados import EstadoInforme


def get_informes_curriculares_por_departamento(
    db: Session, departamento_id: int
) -> List[schemas.InformeCurricularStatus]:
    
    anio_actual = datetime.now().year

    stmt = (
        select(ActividadCurricularInstancia)
        .join(ActividadCurricularInstancia.cursada)
        .join(Cursada.materia)
        .join(Materia.carreras)
        .join(Cursada.cuatrimestre) 
        
        .where(Carrera.departamento_id == departamento_id)
        

        .where(ActividadCurricularInstancia.estado.in_([
            EstadoInforme.COMPLETADO, 
            EstadoInforme.RESUMIDO
        ]))
        # ---------------------------------------------------
        
        .where(Cuatrimestre.anio == anio_actual)

        .options(
            joinedload(ActividadCurricularInstancia.cursada).joinedload(Cursada.materia),
            joinedload(ActividadCurricularInstancia.cursada).joinedload(Cursada.profesor),
            joinedload(ActividadCurricularInstancia.cursada).joinedload(Cursada.cuatrimestre),
        )
        .distinct()
    )
    
    instancias = db.scalars(stmt).all()
    
    resultados = []
    for inst in instancias:
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

