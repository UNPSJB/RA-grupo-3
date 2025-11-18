# backend/src/seed_responses.py
import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, update

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# -----------------------------

from src.database import SessionLocal
from src.persona.models import Inscripcion
from src.encuestas.models import EncuestaInstancia, Encuesta
from src.seccion.models import Seccion
from src.pregunta.models import PreguntaMultipleChoice, PreguntaRedaccion
from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion
from src.enumerados import TipoPregunta, EstadoInstancia
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular
from src.enumerados import EstadoInforme, TipoInstrumento, EstadoInstrumento


def seed_respuestas_y_cierre(db: Session):
    print("🚀 Iniciando simulación de respuestas y cierre de encuestas...")

    # 1. Buscar instancias ACTIVAS
    instancias = db.query(EncuestaInstancia).filter(
        EncuestaInstancia.estado == EstadoInstancia.ACTIVA
    ).options(
        selectinload(EncuestaInstancia.plantilla)
        .selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones),
        selectinload(EncuestaInstancia.cursada)
    ).all()

    if not instancias:
        print("   ! No hay encuestas ACTIVAS para responder. Ejecuta seed_data.py primero.")
        return

    total_respuestas = 0

    # Fechas simuladas para cierre (para probar filtros)
    fechas_cierre = [
        datetime.now(),                    # Hoy
        datetime.now() - timedelta(days=2), # Hace 2 días
        datetime.now() - timedelta(days=7), # Hace 1 semana
        datetime.now() - timedelta(days=10) # Hace 10 días
    ]

    for idx, instancia in enumerate(instancias):
        print(f"   > Procesando encuesta ID {instancia.id} (Cursada {instancia.cursada_id})...")
        
        # Obtener alumnos inscriptos que NO han respondido aún
        inscripciones = db.query(Inscripcion).filter_by(
            cursada_id=instancia.cursada_id, ha_respondido=False
        ).all()

        if not inscripciones:
            print("     - Todos los alumnos ya respondieron.")
        
        # Generar respuestas
        plantilla = instancia.plantilla
        preguntas = []
        for seccion in plantilla.secciones:
            preguntas.extend(seccion.preguntas)

        for inscripcion in inscripciones:
            nuevo_set = RespuestaSet(instrumento_instancia_id=instancia.id)
            respuestas_items = []

            for pregunta in preguntas:
                if pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    if not pregunta.opciones: continue
                    # Simular tendencia positiva (opciones con ID más bajo suelen ser mejores o peores según diseño, 
                    # aquí elegimos al azar pero ponderado hacia las primeras)
                    opcion = random.choice(pregunta.opciones) 
                    respuestas_items.append(RespuestaMultipleChoice(
                        pregunta_id=pregunta.id,
                        opcion_id=opcion.id,
                        tipo=TipoPregunta.MULTIPLE_CHOICE
                    ))
                elif pregunta.tipo == TipoPregunta.REDACCION:
                    respuestas_items.append(RespuestaRedaccion(
                        pregunta_id=pregunta.id,
                        texto="Respuesta simulada automática.",
                        tipo=TipoPregunta.REDACCION
                    ))
            
            nuevo_set.respuestas = respuestas_items
            db.add(nuevo_set)
            
            # Marcar como respondido
            inscripcion.ha_respondido = True
            db.add(inscripcion)
            total_respuestas += 1
        
        # --- CERRAR ENCUESTA ---
        instancia.estado = EstadoInstancia.CERRADA
        # Asignar fecha rotativa para probar filtros
        fecha_simulada = fechas_cierre[idx % len(fechas_cierre)]
        instancia.fecha_fin = fecha_simulada
        
        db.add(instancia)
        print(f"     ! Encuesta CERRADA. Fecha fin: {fecha_simulada.strftime('%Y-%m-%d')}")
        
        # --- Generar Informe de Cátedra Pendiente (para que el profesor lo vea) ---
        # Buscamos plantilla de informe
        plantilla_informe = db.query(ActividadCurricular).filter(
            ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR,
            ActividadCurricular.estado == EstadoInstrumento.PUBLICADA
        ).first()
        
        if plantilla_informe:
             # Verificar si ya existe
            existe = db.query(ActividadCurricularInstancia).filter_by(cursada_id=instancia.cursada_id).first()
            if not existe:
                nuevo_informe = ActividadCurricularInstancia(
                    actividad_curricular_id=plantilla_informe.id,
                    cursada_id=instancia.cursada_id,
                    encuesta_instancia_id=instancia.id,
                    profesor_id=instancia.cursada.profesor_id,
                    estado=EstadoInforme.PENDIENTE,
                    tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR
                )
                db.add(nuevo_informe)
                print("     + Informe de Actividad Curricular generado (PENDIENTE).")

    db.commit()
    print(f"✅ Proceso terminado. Se generaron {total_respuestas} sets de respuestas.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_respuestas_y_cierre(db)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()