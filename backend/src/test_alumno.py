import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session, configure_mappers
from sqlalchemy import select

# --- SETUP DE ENTORNO ---
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.database import SessionLocal

# 1. IMPORTAR TODOS LOS MODELOS (Obligatorio para evitar KeyError)
from src.models import ModeloBase
from src.materia import models as materia_models
from src.persona import models as persona_models
from src.encuestas import models as encuestas_models
from src.seccion import models as seccion_models
from src.pregunta import models as pregunta_models
from src.respuesta import models as respuesta_models
from src.instrumento import models as instrumento_models

# 2. CONFIGURAR MAPPERS MANUALMENTE
configure_mappers()

# 3. IMPORTS ESPECÍFICOS
from src.materia.models import Cursada
from src.persona.models import Alumno, Inscripcion
from src.encuestas.models import EncuestaInstancia, Encuesta, PeriodoEvaluacion
from src.enumerados import EstadoInstancia, EstadoInstrumento

def seed_step1_alumno(db: Session):
    print("🎓 [PASO 1] Preparando entorno para 'alumno1'...")

    alumno = db.scalar(select(Alumno).where(Alumno.username == "alumno1"))
    plantilla = db.scalar(select(Encuesta).where(Encuesta.estado == EstadoInstrumento.PUBLICADA))
    
    if not alumno or not plantilla:
        print("❌ Error: Faltan datos base (Alumno o Plantilla). Ejecuta seed_data y seed_plantilla.")
        return

    # Periodo Activo
    periodo = db.scalar(select(PeriodoEvaluacion).where(PeriodoEvaluacion.nombre == "Ciclo Lectivo Actual (Demo)"))
    if not periodo:
        periodo = PeriodoEvaluacion(
            nombre="Ciclo Lectivo Actual (Demo)",
            fecha_inicio_encuesta=datetime.now(),
            fecha_fin_encuesta=datetime.now(), 
            fecha_limite_informe=datetime.now(),
            fecha_limite_sintetico=datetime.now()
        )
        db.add(periodo)
        db.commit()

    # Seleccionar 3 cursadas random
    cursadas = db.scalars(select(Cursada).limit(20)).all()
    seleccion = random.sample(cursadas, min(3, len(cursadas)))

    for c in seleccion:
        # A. Inscribir (Idempotente)
        insc = db.scalar(select(Inscripcion).filter_by(alumno_id=alumno.id, cursada_id=c.id))
        if not insc:
            db.add(Inscripcion(alumno_id=alumno.id, cursada_id=c.id, ha_respondido=False))
        else:
            insc.ha_respondido = False
            db.add(insc)
        
        # B. Encuesta ACTIVA (Idempotente)
        enc = db.scalar(select(EncuestaInstancia).filter_by(cursada_id=c.id))
        if enc:
            enc.estado = EstadoInstancia.ACTIVA
            enc.periodo_evaluacion_id = periodo.id
            db.add(enc)
        else:
            enc = EncuestaInstancia(
                cursada_id=c.id, plantilla_id=plantilla.id, 
                periodo_evaluacion_id=periodo.id,
                estado=EstadoInstancia.ACTIVA,
                fecha_inicio=datetime.now()
            )
            db.add(enc)
            
        print(f"   -> Encuesta ACTIVA para: {c.materia.nombre}")

    db.commit()
    print("✅ Listo. Loguéate como 'alumno1' (123456).")

if __name__ == "__main__":
    db = SessionLocal()
    seed_step1_alumno(db)
    db.close()