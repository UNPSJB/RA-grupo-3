from datetime import datetime, timedelta
from sqlalchemy import select
from src.database import SessionLocal
from src.enumerados import EstadoInstancia
from src.encuestas.models import EncuestaInstancia, PeriodoEvaluacion
from src.encuestas.services import cerrar_instancia_encuesta
from src.instrumento.services import procesar_vencimiento_informes_profesores
import logging

# Configurar logger para que salga en la consola
logger = logging.getLogger("uvicorn")

def check_ciclo_vida_encuestas():
    """
    Tarea programada que revisa el ciclo de vida basado en PERIODOS.
    """
    db = SessionLocal()
    now = datetime.now()
    
    # --- DEBUG LOG: Para ver si corre y qué hora tiene ---
    print(f"⏰ [SCHEDULER] Ejecutando revisión. Hora del sistema: {now}")
    
    try:
        # --- ENCUESTAS ALUMNOS (APERTURA Y CIERRE) ---
        
        stmt_apertura = select(EncuestaInstancia).join(PeriodoEvaluacion).where(
            EncuestaInstancia.estado == EstadoInstancia.PENDIENTE,
            PeriodoEvaluacion.fecha_inicio_encuesta <= now
        )
        
        encuestas_para_abrir = db.scalars(stmt_apertura).all()
        
        # --- DEBUG LOG: Ver cuántas encontró ---
        if encuestas_para_abrir:
            print(f"   -> Se encontraron {len(encuestas_para_abrir)} encuestas para ABRIR.")
        else:
            # Descomenta esto si quieres ver ruido cuando no hay nada
            # print("   -> No hay encuestas para abrir por ahora.")
            pass

        for encuesta in encuestas_para_abrir:
            encuesta.estado = EstadoInstancia.ACTIVA
            db.add(encuesta)
            logger.info(f"🟢 [AUTO] Encuesta {encuesta.id} ACTIVADA (Periodo iniciado).")
        
        db.commit()

        # ... (Resto del código de cierre igual que antes) ...
        
        stmt_cierre = select(EncuestaInstancia).join(PeriodoEvaluacion).where(
            EncuestaInstancia.estado == EstadoInstancia.ACTIVA,
            PeriodoEvaluacion.fecha_fin_encuesta <= now
        )
        
        encuestas_para_cerrar = db.scalars(stmt_cierre).all()
        
        for encuesta in encuestas_para_cerrar:
            try:
                logger.info(f"🔴 [AUTO] Cerrando Encuesta {encuesta.id} por fin de periodo.")
                
                plazo_profesor = encuesta.periodo.fecha_limite_informe
                
                if not plazo_profesor:
                    plazo_profesor = now + timedelta(days=14)
                
                cerrar_instancia_encuesta(
                    db, 
                    instancia_id=encuesta.id, 
                    fecha_fin_informe=plazo_profesor
                )
            except Exception as e:
                logger.error(f"Error cerrando encuesta {encuesta.id}: {e}")
                db.rollback()
        
        # --- INFORMES PROFESORES (CIERRE) -> SINTÉTICO ---
        procesar_vencimiento_informes_profesores(db)

    except Exception as e:
        logger.error(f"Error en scheduler ciclo vida: {e}")
        db.rollback()
    finally:
        db.close()