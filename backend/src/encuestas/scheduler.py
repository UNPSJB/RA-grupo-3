from datetime import datetime, timedelta # <--- Importar timedelta
from sqlalchemy import select
from src.database import SessionLocal
from src.encuestas.models import EncuestaInstancia
from src.enumerados import EstadoInstancia
# Importamos los servicios necesarios
from src.encuestas.services import cerrar_instancia_encuesta
from src.instrumento.services import procesar_vencimiento_informes_profesores
import logging

logger = logging.getLogger("uvicorn")

def check_ciclo_vida_encuestas():
    """
    Tarea programada que revisa:
    1. Encuestas de Alumnos (Abrir/Cerrar)
    2. Informes de Profesores (Cerrar -> Abrir Sintético)
    """
    db = SessionLocal()
    now = datetime.now()
    
    try:
        # --- PARTE A: ENCUESTAS ALUMNOS ---
        
        # 1. Apertura Automática
        stmt_apertura = select(EncuestaInstancia).where(
            EncuestaInstancia.estado == EstadoInstancia.PENDIENTE,
            EncuestaInstancia.fecha_inicio <= now
        )
        encuestas_para_abrir = db.scalars(stmt_apertura).all()
        
        for encuesta in encuestas_para_abrir:
            encuesta.estado = EstadoInstancia.ACTIVA
            db.add(encuesta)
            logger.info(f"🟢 [AUTO] Encuesta {encuesta.id} INICIADA.")
        
        db.commit()

        # 2. Cierre Automático (Dispara Informe Profesor)
        stmt_cierre = select(EncuestaInstancia).where(
            EncuestaInstancia.estado == EstadoInstancia.ACTIVA,
            EncuestaInstancia.fecha_fin != None,
            EncuestaInstancia.fecha_fin <= now
        )
        encuestas_para_cerrar = db.scalars(stmt_cierre).all()
        
        # Definimos el plazo por defecto para el profesor (ej: 14 días)
        plazo_profesor = now + timedelta(days=14) 

        for encuesta in encuestas_para_cerrar:
            try:
                logger.info(f"🔴 [AUTO] Cerrando Encuesta {encuesta.id} -> Generando Informe Profesor.")
                
                # --- CORRECCIÓN CLAVE ---
                # Pasamos 'fecha_fin_informe' para que el reporte del profesor 
                # también tenga vencimiento y el ciclo continúe.
                cerrar_instancia_encuesta(
                    db, 
                    instancia_id=encuesta.id, 
                    fecha_fin_informe=plazo_profesor
                )
                # ------------------------
                
            except Exception as e:
                logger.error(f"Error cerrando encuesta {encuesta.id}: {e}")
                db.rollback()

        # --- PARTE B: INFORMES PROFESORES -> SINTÉTICO ---
        
        # 3. Cierre Automático Informes Profesores (Dispara Informe Sintético)
        # Ahora sí funcionará porque los informes tienen fecha_fin
        procesar_vencimiento_informes_profesores(db)

    except Exception as e:
        logger.error(f"Error en scheduler ciclo vida: {e}")
        db.rollback()
    finally:
        db.close()