import sys
import os
import random
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import select

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# --- Fin Configuración de Path ---

try:
    from src.database import SessionLocal
    # --- Models ---
    from src.materia.models import Cursada
    from src.encuestas.models import Encuesta, EncuestaInstancia
    from src.instrumento.models import ActividadCurricular, ActividadCurricularInstancia
    from src.pregunta.models import Pregunta, PreguntaMultipleChoice, Opcion
    from src.seccion.models import Seccion
    
    # --- Enums ---
    from src.enumerados import EstadoInstancia, EstadoInforme, TipoInstrumento, TipoPregunta
    
    # --- Services ---
    from src.encuestas import services as encuestas_services
    from src.respuesta import services as respuesta_services
    
    # --- Schemas ---
    from src.respuesta.schemas import RespuestaSetCreate, RespuestaIndividualCreate

except ImportError as e:
    print(f"Error: No se pudieron importar los módulos. Detalle: {e}")
    sys.exit(1)

def seed_completar_informes(db: Session):
    print("Iniciando script para completar informes...")

    # --- PARTE 1: Asegurar que existan ACIs en estado PENDIENTE ---
    
    print("\n--- Parte 1: Creando Instancias de Informe PENDIENTES (simulando cierre de encuestas)...")
    
    # 1.1 Buscar plantilla de encuesta de alumno (usamos la de Ciclo Básico, ID=1)
    plantilla_encuesta_id = db.scalars(
        select(Encuesta.id).where(Encuesta.tipo == TipoInstrumento.ENCUESTA).limit(1)
    ).first()
    
    if not plantilla_encuesta_id:
        print("ERROR: No se encontró una plantilla de Encuesta de Alumno. Ejecuta seed_plantilla.py primero.")
        return

    # 1.2 Buscar todas las Cursadas
    cursadas = db.scalars(select(Cursada)).all()
    if not cursadas:
        print("ERROR: No se encontraron Cursadas. Ejecuta seed_data.py primero.")
        return

    # 1.3 Crear y cerrar EncuestaInstancia para cada cursada que no la tenga
    instancias_activas = []
    for cursada in cursadas:
        instancia_encuesta = db.scalars(
            select(EncuestaInstancia).where(EncuestaInstancia.cursada_id == cursada.id)
        ).first()
        
        if not instancia_encuesta:
            print(f"   + Creando EncuestaInstancia para Cursada ID {cursada.id}...")
            instancia_encuesta = EncuestaInstancia(
                cursada_id=cursada.id,
                plantilla_id=plantilla_encuesta_id,
                estado=EstadoInstancia.ACTIVA
            )
            db.add(instancia_encuesta)
            db.commit()
            db.refresh(instancia_encuesta)
            instancias_activas.append(instancia_encuesta)
        elif instancia_encuesta.estado == EstadoInstancia.ACTIVA:
            instancias_activas.append(instancia_encuesta)

    # 1.4 Cerrar todas las instancias activas para generar los ACIs PENDIENTES
    aci_pendientes_creados = 0
    for instancia in instancias_activas:
        try:
            print(f"   + Cerrando EncuestaInstancia ID {instancia.id} para generar ACI PENDIENTE...")
            encuestas_services.cerrar_instancia_encuesta(db, instancia_id=instancia.id)
            aci_pendientes_creados += 1
        except Exception as e:
            # Ignora el error "BadRequest" que dice que ya existe un informe (eso es bueno)
            if "Ya existe un informe" in str(e):
                print(f"     - (Aviso: Ya existía un informe para la Cursada ID {instancia.cursada_id})")
            else:
                print(f"     - (Error al cerrar instancia {instancia.id}: {e})")

    print(f"--- Parte 1 Completada: {aci_pendientes_creados} nuevos informes PENDIENTES creados ---")


    # --- PARTE 2: Completar los informes PENDIENTES ---

    print("\n--- Parte 2: Completando informes PENDIENTES (simulando respuesta de profesor)...")
    
    # 2.1 Buscar la plantilla de Actividad Curricular (Anexo I)
    plantilla_aci = db.scalars(
        select(ActividadCurricular)
        .where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR)
        .options(
            selectinload(ActividadCurricular.secciones)
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones)
        )
    ).first()

    if not plantilla_aci or not plantilla_aci.secciones:
        print("ERROR: No se encontró la plantilla de Actividad Curricular (Anexo I) o no tiene preguntas.")
        return

    # 2.2 Recolectar todas las preguntas de la plantilla
    todas_las_preguntas = []
    for seccion in plantilla_aci.secciones:
        todas_las_preguntas.extend(seccion.preguntas)

    # 2.3 Buscar todos los informes PENDIENTES
    informes_pendientes = db.scalars(
        select(ActividadCurricularInstancia)
        .where(ActividadCurricularInstancia.estado == EstadoInforme.PENDIENTE)
    ).all()

    if not informes_pendientes:
        print("   - No se encontraron informes PENDIENTES para completar. ¡Todo al día!")
        return

    print(f"   - Se encontraron {len(informes_pendientes)} informes PENDIENTES. Completándolos...")
    
    informes_completados_count = 0
    
    # 2.4 Llenar y enviar cada informe pendiente
    for informe in informes_pendientes:
        respuestas_simuladas = []
        try:
            for pregunta in todas_las_preguntas:
                if pregunta.tipo == TipoPregunta.REDACCION:
                    respuestas_simuladas.append(
                        RespuestaIndividualCreate(
                            pregunta_id=pregunta.id,
                            texto="Respuesta simulada por script."
                        )
                    )
                elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    if pregunta.opciones:
                        opcion_elegida = random.choice(pregunta.opciones)
                        respuestas_simuladas.append(
                            RespuestaIndividualCreate(
                                pregunta_id=pregunta.id,
                                opcion_id=opcion_elegida.id
                            )
                        )
            
            payload = RespuestaSetCreate(respuestas=respuestas_simuladas)
            
            # 2.5 Llamar al servicio que cambia el estado a COMPLETADO
            respuesta_services.crear_submission_profesor(
                db=db,
                instancia_id=informe.id,
                profesor_id=informe.profesor_id,
                respuestas_data=payload
            )
            print(f"   + Informe ID {informe.id} (Cursada {informe.cursada_id}) completado exitosamente.")
            informes_completados_count += 1
            
        except Exception as e:
            print(f"   - ERROR al completar Informe ID {informe.id}: {e}")
            db.rollback()

    print(f"--- Parte 2 Completada: {informes_completados_count} informes pasados a estado COMPLETADO ---")


# --- Punto de entrada ---
if __name__ == "__main__":
    print("Iniciando script de simulación de ciclo...")
    db = SessionLocal()
    try:
        seed_completar_informes(db)
        print("\n¡Simulación finalizada!")
    except Exception as e:
        print(f"\nERROR CRÍTICO durante la simulación: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        print("Conexión a la base de datos cerrada.")