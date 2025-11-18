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

# IDs de las instancias CERRADAS para Ciclo Básico
# (Tus instancias 1 y 2 apuntan a plantilla_id 1, así que esto es correcto)
INSTANCIAS_BASICO_A_RESPONDER = [1, 2] 

# !! IMPORTANTE: ¡DEBES ACTUALIZAR ESTO!
# Primero crea EncuestaInstancia para tu plantilla de "Ciclo Superior" (probablemente plantilla_id=2)
# y luego pon los IDs de esas *nuevas* instancias aquí.
INSTANCIAS_SUPERIOR_A_RESPONDER = [3,4] # Ejemplo: [3, 4] si creas nuevas instancias para la plantilla 2


def create_tables():
     """Asegura que todas las tablas estén creadas."""
     print("Verificando/Creando tablas si no existen...")
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


def seed_responses(db: Session):
    """
    Inscribe 20 alumnos y genera un RespuestaSet para cada uno,
    diferenciando entre encuestas de Ciclo Básico y Ciclo Superior.
    """
    print("Iniciando script de generación de respuestas...")
    
    # --- 1. Obtener/Crear Alumnos de Prueba ---
    print(f"--- Paso 1: Verificando/Creando {NUM_ALUMNOS} Alumnos de Prueba ---")
    alumnos_creados = []
    alumnos_a_añadir = []
    for i in range(1, NUM_ALUMNOS + 1):
        # Empezamos desde ID 100 para evitar colisiones con IDs de prueba (como el Alumno 2)
        alumno_id_simulado = 100 + i 
        alumno_existente = db.get(Alumno, alumno_id_simulado)
        
        if not alumno_existente:
            print(f"   + Creando alumno: 'Alumno Simulado {i:02d}' con ID={alumno_id_simulado}")
            # Forzamos el ID para consistencia
            nuevo_alumno = Alumno(id=alumno_id_simulado, nombre=f"Alumno Simulado {i:02}", tipo="ALUMNO", username=f"alumno_sim_{i:02}", hashed_password="dummy")
            alumnos_a_añadir.append(nuevo_alumno)
            alumnos_creados.append(nuevo_alumno)
        else:
            alumnos_creados.append(alumno_existente)

    if alumnos_a_añadir:
        try:
            db.add_all(alumnos_a_añadir)
            db.commit()
            print(f"   -> {len(alumnos_a_añadir)} alumnos nuevos creados.")
        except Exception as e:
            db.rollback()
            print(f"\n   ! ERROR al insertar alumnos. ¿Quizás la BBDD no permite inserción de ID manual? Error: {e}")
            print("   -> Intentando de nuevo sin forzar ID...")
            db.rollback() # Limpia la sesión
            alumnos_creados = [] # Resetea la lista
            for i in range(1, NUM_ALUMNOS + 1):
                nombre_alumno = f"Alumno Simulado {i:02d}"
                alumno_existente = db.scalar(select(Alumno).where(Alumno.nombre == nombre_alumno))
                if not alumno_existente:
                    nuevo_alumno = Alumno(nombre=nombre_alumno)
                    db.add(nuevo_alumno)
                    db.commit() # Commit uno por uno
                    db.refresh(nuevo_alumno)
                    alumnos_creados.append(nuevo_alumno)
                else:
                    alumnos_creados.append(alumno_existente)
            print(f"   -> {len(alumnos_creados)} alumnos listos (sin forzar ID).")
    else:
        print("   -> Todos los alumnos de prueba ya existían.")

    # --- 2. Cargar Plantillas de Instancias ---
    INSTANCIAS_A_RESPONDER = INSTANCIAS_BASICO_A_RESPONDER + INSTANCIAS_SUPERIOR_A_RESPONDER
    
    if not INSTANCIAS_SUPERIOR_A_RESPONDER:
        print("\n   ******************************************************************")
        print("   ! ADVERTENCIA: No hay instancias de 'Ciclo Superior' configuradas.")
        print("   ! El script solo generará respuestas para Ciclo Básico.")
        print("   ! Edita 'INSTANCIAS_SUPERIOR_A_RESPONDER' en este script para probarlas.")
        print("   ******************************************************************\n")
        
    if not INSTANCIAS_A_RESPONDER:
        print("   ! ERROR: No hay instancias configuradas en 'INSTANCIAS_BASICO_A_RESPONDER' o 'INSTANCIAS_SUPERIOR_A_RESPONDER'. Saliendo.")
        return

    print(f"--- Paso 2: Cargando plantillas para instancias {INSTANCIAS_A_RESPONDER} ---")
    instancias_con_preguntas = []
    for instancia_id in INSTANCIAS_A_RESPONDER:
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

        todas_las_preguntas = []
        for seccion in instancia.plantilla.secciones:
            todas_las_preguntas.extend(seccion.preguntas)
            
        print(f"   -> Instancia {instancia_id} (Cursada {instancia.cursada_id}) cargada. Plantilla: '{instancia.plantilla.titulo}' ({len(todas_las_preguntas)} preguntas).")
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
                inscripcion = Inscripcion(
                    alumno_id=alumno.id, 
                    cursada_id=instancia.cursada_id,
                    ha_respondido=False
                )
                db.add(inscripcion)
            
            # B. Verificar si ya respondió
            if inscripcion.ha_respondido:
                continue

            # C. Crear el Paquete de Respuestas (RespuestaSet)
            print(f"   + Creando RespuestaSet para Alumno {alumno.id} en Instancia {instancia.id}...")
            nuevo_set = RespuestaSet(instrumento_instancia_id=instancia.id)
            
            respuestas_para_el_set = []
            
            # --- LÓGICA DE DECISIÓN DE PLANTILLA ---
            is_ciclo_basico = "Ciclo Básico" in instancia.plantilla.titulo
            is_ciclo_superior = "Ciclo Superior" in instancia.plantilla.titulo
            
            if not is_ciclo_basico and not is_ciclo_superior:
                print(f"   ! ADVERTENCIA: Plantilla '{instancia.plantilla.titulo}' no reconocida. Saltando.")
                continue

            for pregunta in preguntas:
                if pregunta.tipo == TipoPregunta.REDACCION:
                    texto_respuesta = f"Respuesta simulada por Alumno {alumno.id}."
                    nueva_respuesta = RespuestaRedaccion(
                        pregunta_id=pregunta.id, texto=texto_respuesta, tipo=pregunta.tipo
                    )
                    respuestas_para_el_set.append(nueva_respuesta)
                    
                elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    if not pregunta.opciones: continue 
                    
                    opcion_elegida = None
                    texto_pregunta = pregunta.texto.lower()
                    
                    try:
                        # --- SECCIÓN A (Común) ---
                        if "cuántas veces te has inscripto" in texto_pregunta:
                            opcion_elegida = random.choice([o for o in pregunta.opciones if o.texto in ["Una", "Más de una"]])
                        elif "porcentaje de asistencia" in texto_pregunta:
                            opcion_elegida = random.choice([o for o in pregunta.opciones if o.texto in ["Entre 0 y 50%", "Más 50%"]])
                        elif "conocimientos previos" in texto_pregunta:
                            opcion_elegida = random.choice([o for o in pregunta.opciones if o.texto in ["Escasos", "Suficientes"]])
                        
                        # --- Lógica CICLO BÁSICO (Anexo I) ---
                        elif is_ciclo_basico:
                            if "cómo evalúas tu experiencia" in texto_pregunta:
                                # Es la G1 de Ciclo Básico (Escala Satisfactorio)
                                opcion_elegida = random.choice([o for o in pregunta.opciones if "satisfactorio" in o.texto.lower()])
                            else:
                                # Es una pregunta Sí/No/NPO de Ciclo Básico
                                opcion_elegida = random.choice([o for o in pregunta.opciones if o.texto in ["Sí", "No", "No puedo opinar (NPO)"]])
                        
                        # --- Lógica CICLO SUPERIOR (Anexo II) ---
                        elif is_ciclo_superior:
                            # Todas las preguntas de la B a la G usan la escala 4-1
                            if any("bueno" in o.texto.lower() for o in pregunta.opciones):
                                opcion_elegida = random.choice(pregunta.opciones)
                        
                        if not opcion_elegida:
                             opcion_elegida = random.choice(pregunta.opciones)

                        nueva_respuesta = RespuestaMultipleChoice(
                            pregunta_id=pregunta.id, opcion_id=opcion_elegida.id, tipo=pregunta.tipo
                        )
                        respuestas_para_el_set.append(nueva_respuesta)

                    except Exception as e:
                        print(f"   ! ERROR procesando pregunta '{texto_pregunta[:30]}...'. Opciones: {[o.texto for o in pregunta.opciones]}. Error: {e}")
                        continue

            # D. Vincular todo y marcar como respondido
            nuevo_set.respuestas = respuestas_para_el_set
            inscripcion.ha_respondido = True
            
            db.add(nuevo_set)
            db.add(inscripcion)

            try:
                db.commit()
                total_sets_creados += 1
            except Exception as e:
                print(f"   ! ERROR al guardar RespuestaSet para Alumno {alumno.id}: {e}")
                db.rollback()

    print(f"\n¡Simulación completada! Se crearon {total_sets_creados} nuevos RespuestaSet.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de respuestas simuladas (v2)...")
    
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