import sys
import os
import random
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# --- Configuración de Path (para que encuentre 'src') ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# --- Fin Configuración de Path ---

try:
    from src.database import SessionLocal, engine
    from src.models import ModeloBase
    
    # Importar TODOS los módulos de modelos para registrar en ModeloBase
    from src.instrumento import models as instrumento_models
    from src.encuestas import models as encuestas_models
    from src.materia import models as materia_models
    from src.persona import models as persona_models
    from src.seccion import models as seccion_models
    from src.pregunta import models as pregunta_models
    from src.respuesta import models as respuesta_models

    # Importar las clases específicas que usaremos
    from src.persona.models import Alumno, Inscripcion
    from src.materia.models import Cursada
    from src.encuestas.models import EncuestaInstancia, Encuesta
    from src.seccion.models import Seccion
    from src.pregunta.models import Pregunta, PreguntaRedaccion, PreguntaMultipleChoice, Opcion
    from src.respuesta.models import RespuestaSet, RespuestaRedaccion, RespuestaMultipleChoice
    from src.enumerados import TipoPregunta, EstadoInstancia

except ImportError as e:
    print(f"Error: No se pudieron importar los módulos. Asegúrate de que estás en el directorio 'backend'.")
    print(f"Detalle: {e}")
    print(f"Sys.path actual: {sys.path}")
    sys.exit(1)

# --- Constantes de Simulación ---
NUM_ALUMNOS = 20
# IDs de las instancias CERRADAS para las que queremos generar respuestas
INSTANCIAS_A_RESPONDER = [1, 2] 


def create_tables():
     """Asegura que todas las tablas estén creadas."""
     print("Verificando/Creando tablas si no existen...")
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


def seed_responses(db: Session):
    """
    Inscribe 20 alumnos en las cursadas 1 y 2, y genera un RespuestaSet
    para cada uno en las instancias de encuesta 1 y 2.
    """
    print("Iniciando script de generación de respuestas...")
    
    # --- 1. Obtener/Crear Alumnos de Prueba ---
    print(f"--- Paso 1: Verificando/Creando {NUM_ALUMNOS} Alumnos de Prueba ---")
    alumnos_creados = []
    alumnos_a_añadir = []
    for i in range(1, NUM_ALUMNOS + 1):
        nombre_alumno = f"Alumno Simulado {i:02d}"
        alumno_existente = db.scalar(select(Alumno).where(Alumno.nombre == nombre_alumno))
        
        if not alumno_existente:
            print(f"   + Creando alumno: {nombre_alumno}")
            nuevo_alumno = Alumno(nombre=nombre_alumno)
            alumnos_a_añadir.append(nuevo_alumno)
            alumnos_creados.append(nuevo_alumno) # Añadir a la lista para el siguiente paso
        else:
            alumnos_creados.append(alumno_existente) # Usar el existente

    if alumnos_a_añadir:
        db.add_all(alumnos_a_añadir)
        db.commit()
        print(f"   -> {len(alumnos_a_añadir)} alumnos nuevos creados.")
    else:
        print("   -> Todos los alumnos de prueba ya existían.")

    # --- 2. Cargar Plantillas de Instancias ---
    print(f"--- Paso 2: Cargando plantillas para instancias {INSTANCIAS_A_RESPONDER} ---")
    instancias_con_preguntas = []
    for instancia_id in INSTANCIAS_A_RESPONDER:
        # Usamos la misma consulta que 'obtener_plantilla_para_instancia_activa'
        # pero sin filtrar por estado, ya que están CERRADAS.
        instancia = db.query(EncuestaInstancia)\
            .filter(EncuestaInstancia.id == instancia_id)\
            .options(
                selectinload(EncuestaInstancia.plantilla) 
                .selectinload(Encuesta.secciones)
                .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
                .selectinload(PreguntaMultipleChoice.opciones)
            )\
            .first()
        
        if not instancia:
            print(f"   ! ERROR: No se encontró la EncuestaInstancia con ID={instancia_id}. Saltando...")
            continue
        
        if not instancia.plantilla or not instancia.plantilla.secciones:
            print(f"   ! ERROR: La Instancia ID={instancia_id} no tiene plantilla o secciones. Saltando...")
            continue

        # Aplanamos la lista de preguntas para iterar fácilmente
        todas_las_preguntas = []
        for seccion in instancia.plantilla.secciones:
            todas_las_preguntas.extend(seccion.preguntas)
            
        print(f"   -> Instancia {instancia_id} (Cursada {instancia.cursada_id}) cargada con {len(todas_las_preguntas)} preguntas.")
        instancias_con_preguntas.append((instancia, todas_las_preguntas))

    # --- 3. Inscribir Alumnos y Generar Respuestas ---
    print(f"--- Paso 3: Inscribiendo alumnos y generando respuestas ---")
    
    total_sets_creados = 0
    for alumno in alumnos_creados:
        for (instancia, preguntas) in instancias_con_preguntas:
            
            # A. Asegurar Inscripción
            inscripcion = db.scalar(
                select(Inscripcion).where(
                    Inscripcion.alumno_id == alumno.id,
                    Inscripcion.cursada_id == instancia.cursada_id
                )
            )
            
            if not inscripcion:
                #print(f"   - Inscribiendo Alumno {alumno.id} en Cursada {instancia.cursada_id}...")
                inscripcion = Inscripcion(
                    alumno_id=alumno.id, 
                    cursada_id=instancia.cursada_id,
                    ha_respondido=False # Se setea a True abajo
                )
                db.add(inscripcion)
                # No hacemos commit aquí, lo hacemos junto con la respuesta
            
            # B. Verificar si ya respondió
            if inscripcion.ha_respondido:
                #print(f"   - Alumno {alumno.id} ya respondió la Instancia {instancia.id}. Saltando.")
                continue

            # C. Crear el Paquete de Respuestas (RespuestaSet)
            print(f"   + Creando RespuestaSet para Alumno {alumno.id} en Instancia {instancia.id}...")
            nuevo_set = RespuestaSet(instrumento_instancia_id=instancia.id)
            
            respuestas_para_el_set = []
            for pregunta in preguntas:
                if pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    if not pregunta.opciones: continue # Seguridad
                    opcion_elegida = random.choice(pregunta.opciones)
                    nueva_respuesta = RespuestaMultipleChoice(
                        pregunta_id=pregunta.id,
                        opcion_id=opcion_elegida.id,
                        tipo=pregunta.tipo
                    )
                    respuestas_para_el_set.append(nueva_respuesta)
                    
                elif pregunta.tipo == TipoPregunta.REDACCION:
                    texto_respuesta = f"Respuesta de redacción simulada por Alumno {alumno.id} para Pregunta {pregunta.id}."
                    nueva_respuesta = RespuestaRedaccion(
                        pregunta_id=pregunta.id,
                        texto=texto_respuesta,
                        tipo=pregunta.tipo
                    )
                    respuestas_para_el_set.append(nueva_respuesta)

            # D. Vincular todo y marcar como respondido
            nuevo_set.respuestas = respuestas_para_el_set
            inscripcion.ha_respondido = True
            
            db.add(nuevo_set) # Añade el set (con sus respuestas en cascada)
            db.add(inscripcion) # Actualiza la inscripción

            try:
                db.commit() # Commit por cada alumno/encuesta
                total_sets_creados += 1
            except Exception as e:
                print(f"   ! ERROR al guardar RespuestaSet para Alumno {alumno.id}: {e}")
                db.rollback()

    print(f"\n¡Simulación completada! Se crearon {total_sets_creados} nuevos RespuestaSet.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de respuestas simuladas...")
    
    # 1. Asegurarse que las tablas existan
    create_tables()

    # 2. Obtener sesión de BBDD
    db = SessionLocal()
    try:
        # 3. Ejecutar la lógica de seeding
        seed_responses(db)
        print("\nScript finalizado exitosamente.")
    except Exception as e:
        print(f"\nERROR CRÍTICO durante la carga de respuestas: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        # 4. Cerrar sesión
        db.close()
        print("Conexión a la base de datos cerrada.")