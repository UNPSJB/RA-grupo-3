import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session, configure_mappers
from sqlalchemy import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.database import SessionLocal

# 1. CARGA DE MODELOS
from src.models import ModeloBase
from src.materia import models as materia_models
from src.persona import models as persona_models
from src.encuestas import models as encuestas_models
from src.seccion import models as seccion_models
from src.pregunta import models as pregunta_models
from src.respuesta import models as respuesta_models
from src.instrumento import models as instrumento_models

configure_mappers()

# 2. IMPORTS ESPECÍFICOS
from src.materia.models import Cursada, Materia, Carrera, Departamento
from src.persona.models import Profesor, Inscripcion
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular
from src.encuestas.models import EncuestaInstancia, Encuesta, PeriodoEvaluacion
from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice
from src.enumerados import EstadoInforme, EstadoInstancia, EstadoInstrumento, TipoInstrumento, TipoPregunta

def seed_step2_profesor(db: Session):
    print("👨‍🏫 [PASO 2] Generando Informes Profesores (Trelew)...")

    depto = db.scalar(select(Departamento).where(Departamento.nombre.ilike("%(TW)%")))
    plantilla_enc = db.scalar(select(Encuesta).where(Encuesta.tipo == TipoInstrumento.ENCUESTA))
    plantilla_inf = db.scalar(select(ActividadCurricular).where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR))

    if not depto:
        print("❌ No se encontró Depto Trelew.")
        return

    # 4 Cursadas de Trelew
    cursadas = db.scalars(
        select(Cursada).join(Materia).join(Materia.carreras)
        .where(Carrera.departamento_id == depto.id).limit(4)
    ).unique().all()

    # Periodo
    periodo = db.scalar(select(PeriodoEvaluacion).where(PeriodoEvaluacion.nombre == "Ciclo Cerrado (Demo)"))
    if not periodo:
        periodo = PeriodoEvaluacion(
            nombre="Ciclo Cerrado (Demo)", 
            fecha_inicio_encuesta=datetime.now(), fecha_fin_encuesta=datetime.now(),
            fecha_limite_informe=datetime.now(), fecha_limite_sintetico=datetime.now()
        )
        db.add(periodo)
        db.commit()

    preguntas_mc = [p for s in plantilla_enc.secciones for p in s.preguntas if p.tipo == TipoPregunta.MULTIPLE_CHOICE]

    for cursada in cursadas:
        # A. Encuesta CERRADA (Idempotente)
        enc = db.scalar(select(EncuestaInstancia).where(EncuestaInstancia.cursada_id == cursada.id))
        if enc:
            enc.estado = EstadoInstancia.CERRADA
            enc.periodo_evaluacion_id = periodo.id
            db.add(enc)
            # Limpiar respuestas viejas
            db.query(RespuestaSet).filter(RespuestaSet.instrumento_instancia_id == enc.id).delete()
        else:
            enc = EncuestaInstancia(
                cursada_id=cursada.id, plantilla_id=plantilla_enc.id, 
                periodo_evaluacion_id=periodo.id, estado=EstadoInstancia.CERRADA,
                fecha_inicio=datetime.now(), fecha_fin=datetime.now()
            )
            db.add(enc)
        
        db.flush() 

        # --- CORRECCIÓN AQUÍ: Actualizar Inscripciones ---
        # Obtenemos los alumnos inscritos en esta cursada
        inscripciones = db.scalars(select(Inscripcion).where(Inscripcion.cursada_id == cursada.id)).all()
        
        # Decidimos cuántos van a "responder" (ej. 15 de 26)
        cantidad_a_responder = min(len(inscripciones), random.randint(10, 20))
        alumnos_que_responden = inscripciones[:cantidad_a_responder]
        
        print(f"   + Generando {cantidad_a_responder} respuestas para: {cursada.materia.nombre}")

        # Iteramos sobre los alumnos reales para marcar que respondieron
        for inscripcion in alumnos_que_responden:
            # 1. Marcar como respondido en la tabla de inscripciones (ESTO FALTABA PARA EL DASHBOARD)
            inscripcion.ha_respondido = True
            db.add(inscripcion)

            # 2. Crear el set de respuestas anónimas (ESTO ES PARA LOS GRÁFICOS)
            rset = RespuestaSet(instrumento_instancia_id=enc.id)
            db.add(rset)
            db.flush()
            
            for p in preguntas_mc:
                if p.opciones:
                    op = random.choice(p.opciones)
                    db.add(RespuestaMultipleChoice(
                        pregunta_id=p.id, respuesta_set_id=rset.id, 
                        tipo=TipoPregunta.MULTIPLE_CHOICE, opcion_id=op.id
                    ))

        # C. Informe PENDIENTE para el Profesor
        inf = db.scalar(select(ActividadCurricularInstancia).where(ActividadCurricularInstancia.cursada_id == cursada.id))
        if inf:
            inf.estado = EstadoInforme.PENDIENTE
            inf.encuesta_instancia_id = enc.id
            db.add(inf)
        else:
            inf = ActividadCurricularInstancia(
                actividad_curricular_id=plantilla_inf.id, cursada_id=cursada.id,
                encuesta_instancia_id=enc.id, profesor_id=cursada.profesor_id,
                estado=EstadoInforme.PENDIENTE, tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR
            )
            db.add(inf)
        
        profesor = db.get(Profesor, cursada.profesor_id)
        print(f"     -> Profesor asignado: {profesor.username} (Pass: 123456)")

    db.commit()
    print("✅ Listo. Dashboard actualizado con tasa de respuesta correcta.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_step2_profesor(db)
    db.close()