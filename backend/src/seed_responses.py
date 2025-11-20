import sys
import os
import random
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# -----------------------------

try:
    from src.database import SessionLocal, engine
    from src.models import ModeloBase
    
    # Imports de modelos en orden para evitar errores de registro
    from src.seccion import models as seccion_models
    from src.pregunta import models as pregunta_models
    from src.respuesta import models as respuesta_models
    from src.instrumento import models as instrumento_models
    from src.encuestas import models as encuestas_models
    from src.materia import models as materia_models
    from src.persona import models as persona_models

    # Clases específicas
    from src.persona.models import Alumno, Inscripcion
    from src.materia.models import Cursada
    from src.encuestas.models import EncuestaInstancia, Encuesta
    from src.seccion.models import Seccion
    from src.pregunta.models import Pregunta, PreguntaRedaccion, PreguntaMultipleChoice, Opcion
    from src.respuesta.models import RespuestaSet, RespuestaRedaccion, RespuestaMultipleChoice
    from src.enumerados import TipoPregunta, EstadoInstancia, EstadoInforme, TipoInstrumento, EstadoInstrumento
    from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular
    
    # --- NUEVO IMPORT ---
    from src.auth.services import get_password_hash

except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

# --- Constantes ---
NUM_ALUMNOS = 20

def create_tables():
     print("Verificando tablas...")
     ModeloBase.metadata.create_all(bind=engine)

def seed_responses(db: Session):
    print("Iniciando script de generación de respuestas...")
    
    # --- 1. Obtener/Crear Alumnos de Prueba ---
    print(f"--- Paso 1: Verificando/Creando {NUM_ALUMNOS} Alumnos de Prueba ---")
    alumnos_creados = []
    
    for i in range(1, NUM_ALUMNOS + 1):
        # Intentamos usar los alumnos que ya creó seed_data.py si coinciden, o creamos nuevos
        # Nota: seed_data crea "alumno1", "alumno2"...
        username_alumno = f"alumno{i}"
        
        # Buscar por username para evitar duplicados
        alumno_existente = db.scalar(select(Alumno).where(Alumno.username == username_alumno))
        
        if not alumno_existente:
            # Si no existe (por ej. si queremos 20 y seed_data solo hizo 10), lo creamos
            nuevo_alumno = Alumno(
                nombre=f"Alumno Simulado {i:02d}",
                username=username_alumno,
                hashed_password=get_password_hash("123456") # <--- SOLUCIÓN AQUÍ
            )
            db.add(nuevo_alumno)
            db.commit()
            db.refresh(nuevo_alumno)
            alumnos_creados.append(nuevo_alumno)
            print(f"   + Creado extra: {username_alumno}")
        else:
            alumnos_creados.append(alumno_existente)

    print(f"   -> Total alumnos listos para responder: {len(alumnos_creados)}")

    # --- 2. Cargar Encuestas ACTIVAS ---
    print(f"--- Paso 2: Buscando encuestas ACTIVAS ---")
    
    instancias_activas = db.query(EncuestaInstancia)\
        .filter(EncuestaInstancia.estado == EstadoInstancia.ACTIVA)\
        .options(
            selectinload(EncuestaInstancia.plantilla) 
            .selectinload(Encuesta.secciones)
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones)
        )\
        .all()

    if not instancias_activas:
        print("   ! ADVERTENCIA: No hay encuestas en estado ACTIVA. Ejecuta seed_data.py primero.")
        return

    print(f"   -> Se encontraron {len(instancias_activas)} encuestas activas.")

    # --- 3. Inscribir Alumnos y Generar Respuestas ---
    print(f"--- Paso 3: Generando respuestas... ---")
    
    total_sets_creados = 0
    
    for instancia in instancias_activas:
        if not instancia.plantilla or not instancia.plantilla.secciones:
            continue
            
        print(f"   > Procesando Cursada {instancia.cursada_id}...")
        
        todas_las_preguntas = []
        for seccion in instancia.plantilla.secciones:
            todas_las_preguntas.extend(seccion.preguntas)

        for alumno in alumnos_creados:
            
            # A. Asegurar Inscripción
            inscripcion = db.scalar(
                select(Inscripcion).where(
                    Inscripcion.alumno_id == alumno.id,
                    Inscripcion.cursada_id == instancia.cursada_id
                )
            )
            
            if not inscripcion:
                inscripcion = Inscripcion(
                    alumno_id=alumno.id, 
                    cursada_id=instancia.cursada_id,
                    ha_respondido=False
                )
                db.add(inscripcion)
                db.commit()
                db.refresh(inscripcion)
            
            if inscripcion.ha_respondido:
                continue
            
            # --- FACTOR ALEATORIO: 80% de probabilidad de responder ---
            if random.random() > 0.8:
                continue

            # C. Crear Respuestas
            nuevo_set = RespuestaSet(instrumento_instancia_id=instancia.id)
            respuestas_para_el_set = []

            for pregunta in todas_las_preguntas:
                if pregunta.tipo == TipoPregunta.REDACCION:
                    if random.random() > 0.7: # Solo algunos comentan
                        texto = f"Opinión simulada del alumno {alumno.username}."
                        respuestas_para_el_set.append(RespuestaRedaccion(
                            pregunta_id=pregunta.id, texto=texto, tipo=pregunta.tipo
                        ))
                    
                elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    if not pregunta.opciones: continue 
                    opcion = random.choice(pregunta.opciones)
                    respuestas_para_el_set.append(RespuestaMultipleChoice(
                        pregunta_id=pregunta.id, opcion_id=opcion.id, tipo=pregunta.tipo
                    ))

            nuevo_set.respuestas = respuestas_para_el_set
            inscripcion.ha_respondido = True
            
            db.add(nuevo_set)
            db.add(inscripcion)
            total_sets_creados += 1

        # Guardar por instancia para no saturar
        try:
            db.commit()
        except Exception as e:
            print(f"   ! Error en commit: {e}")
            db.rollback()

    print(f"\n¡Listo! Se crearon {total_sets_creados} encuestas respondidas.")


if __name__ == "__main__":
    create_tables()
    db = SessionLocal()
    try:
        seed_responses(db)
    except Exception as e:
        print(f"\nERROR CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()