# backend/src/seed_plantillas.py
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import select

# Añadir el directorio raíz del backend al sys.path
# Esto asume que el script está en backend/src/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir) # Sube un nivel a 'backend'
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# --- INICIO DE LA CORRECCIÓN ---
try:
    from src.database import SessionLocal, engine
    from src.models import ModeloBase
    
    # Importar TODOS los módulos que definen modelos 
    # para que se registren en ModeloBase ANTES de usarlos.
    # Esta es la corrección clave.
    from src.instrumento import models as instrumento_models
    from src.encuestas import models as encuestas_models
    from src.materia import models as materia_models
    from src.persona import models as persona_models
    from src.seccion import models as seccion_models
    from src.pregunta import models as pregunta_models
    from src.respuesta import models as respuesta_models

    # Ahora podemos importar las clases específicas que necesitamos de esos módulos
    from src.instrumento.models import InstrumentoBase, ActividadCurricular
    from src.encuestas.models import Encuesta 
    from src.seccion.models import Seccion
    from src.pregunta.models import Pregunta, PreguntaRedaccion, PreguntaMultipleChoice, Opcion
    from src.enumerados import TipoInstrumento, TipoPregunta, EstadoInstrumento
except ImportError as e:
    print(f"Error: No se pudieron importar los módulos. Asegúrate de que estás en el directorio 'backend'.")
    print(f"Detalle: {e}")
    print(f"Sys.path actual: {sys.path}")
    sys.exit(1)
# --- FIN DE LA CORRECCIÓN ---


# --- Funciones Helper ---

def find_or_create_plantilla(db: Session, titulo: str, descripcion: str, tipo: TipoInstrumento, anexo: str, estado: EstadoInstrumento) -> InstrumentoBase:
    """Busca una plantilla por título. Si no existe, la crea."""
    stmt = select(InstrumentoBase).where(InstrumentoBase.titulo == titulo)
    plantilla = db.scalars(stmt).first()
    
    if plantilla:
        print(f"   - Plantilla encontrada: '{titulo}' (ID: {plantilla.id})")
        return plantilla
    
    print(f"   + Creando plantilla: '{titulo}'")
    
    if tipo == TipoInstrumento.ENCUESTA:
        plantilla = Encuesta(
            titulo=titulo,
            descripcion=descripcion,
            anexo=anexo,
            estado=estado
        )
    elif tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR:
        plantilla = ActividadCurricular(
            titulo=titulo,
            descripcion=descripcion,
            anexo=anexo,
            estado=estado
        )
    else:
        # Añade lógica para otros tipos si es necesario
        raise ValueError(f"Tipo de instrumento no manejado: {tipo}")
        
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    print(f"     -> Creada con ID: {plantilla.id}")
    return plantilla

def find_or_create_seccion(db: Session, instrumento: InstrumentoBase, nombre_seccion: str) -> Seccion:
    """Busca una sección por nombre dentro de un instrumento. Si no existe, la crea."""
    stmt = select(Seccion).where(
        Seccion.instrumento_id == instrumento.id,
        Seccion.nombre == nombre_seccion
    )
    seccion = db.scalars(stmt).first()
    
    if seccion:
        return seccion
        
    print(f"     + Añadiendo sección: '{nombre_seccion}'")
    seccion = Seccion(
        nombre=nombre_seccion,
        instrumento_id=instrumento.id
    )
    db.add(seccion)
    db.commit()
    db.refresh(seccion)
    return seccion

def crear_pregunta_mc(db: Session, seccion: Seccion, texto_pregunta: str, opciones_texto: list[str]):
    """Crea una pregunta Multiple Choice si no existe en la sección."""
    stmt = select(Pregunta).where(
        Pregunta.seccion_id == seccion.id,
        Pregunta.texto == texto_pregunta
    )
    pregunta_existente = db.scalars(stmt).first()
    
    if pregunta_existente:
        return

    print(f"       + Pregunta (MC): {texto_pregunta[:50]}...")
    
    opciones_obj = [Opcion(texto=texto) for texto in opciones_texto]
    
    nueva_pregunta = PreguntaMultipleChoice(
        texto=texto_pregunta,
        tipo=TipoPregunta.MULTIPLE_CHOICE,
        seccion_id=seccion.id,
        opciones=opciones_obj
    )
    db.add(nueva_pregunta)

def crear_pregunta_redaccion(db: Session, seccion: Seccion, texto_pregunta: str):
    """Crea una pregunta de Redacción si no existe en la sección."""
    stmt = select(Pregunta).where(
        Pregunta.seccion_id == seccion.id,
        Pregunta.texto == texto_pregunta
    )
    pregunta_existente = db.scalars(stmt).first()
    
    if pregunta_existente:
        return
        
    print(f"       + Pregunta (Redacción): {texto_pregunta[:50]}...")
    
    nueva_pregunta = PreguntaRedaccion(
        texto=texto_pregunta,
        tipo=TipoPregunta.REDACCION,
        seccion_id=seccion.id
    )
    db.add(nueva_pregunta)

# --- Función Principal de Seeding ---

def seed_plantillas_data(db: Session):
    """
    Inserta las plantillas de Encuesta Alumno (Anexo I) y 
    Informe Actividad Curricular (Anexo I) con todas sus secciones y preguntas.
    """
    print("Iniciando seeding de plantillas, secciones y preguntas...")
    
    try:
        # --- 1. PLANTILLA: ENCUESTA ALUMNOS (CICLO BÁSICO) ---
        # Basado en DCDFI-5-2014-3.pdf (Anexo I, págs 3-6)
        
        plantilla_encuesta_basico = find_or_create_plantilla(
            db=db,
            titulo="Encuesta Alumnos - Ciclo Básico (ANEXO I DCDFI 005/2014)",
            descripcion="Instrumento de seguimiento y evaluación de los procesos de enseñar y de aprender en la esfera de cada cátedra (1° y 2° año).",
            tipo=TipoInstrumento.ENCUESTA,
            anexo="Anexo I (DCDFI N° 005/2014)",
            estado=EstadoInstrumento.PUBLICADA
        )
        
        # Opciones comunes para Sí/No/NPO
        opciones_si_no_npo = ["Sí", "No", "No puedo opinar (NPO)"]

        # Sección B: Comunicación y desarrollo de la asignatura
        seccion_b = find_or_create_seccion(db, plantilla_encuesta_basico, "B: Comunicación y desarrollo de la asignatura")
        crear_pregunta_mc(db, seccion_b, "¿El profesor brindó al inicio del curso, información referida al desarrollo de la asignatura (programa, cronograma, régimen de cursada y criterios de evaluación.)?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_b, "¿La bibliografía propuesta por la cátedra estuvo disponible en la biblioteca o centros de documentación?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_b, "¿El profesor ofreció la posibilidad de establecer una buena comunicación en diferentes aspectos de la vida universitaria?", opciones_si_no_npo)

        # Sección C: Metodología
        seccion_c = find_or_create_seccion(db, plantilla_encuesta_basico, "C: Metodología")
        crear_pregunta_mc(db, seccion_c, "¿Se propusieron clases de apoyo y consultas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_c, "¿Los contenidos desarrollados en las clases teóricas se correspondieron con los trabajos prácticos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_c, "¿Las clases prácticas de laboratorio te resultaron de utilidad?", opciones_si_no_npo)

        # Sección D: Evaluación
        seccion_d = find_or_create_seccion(db, plantilla_encuesta_basico, "D: Evaluación")
        crear_pregunta_mc(db, seccion_d, "¿Hubo relación entre el desarrollo de las clases teóricas y prácticas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_d, "¿Existió relación entre los temas desarrollados en clase y los temas evaluados?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_d, "¿Te brindaron posibilidades para comentar y revisar los resultados de los exámenes parciales?", opciones_si_no_npo)

        # Sección E: Actuación de los miembros de la Cátedra (TEORÍA)
        seccion_e_t = find_or_create_seccion(db, plantilla_encuesta_basico, "E: Actuación de los miembros de la Cátedra (TEORÍA)")
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Se respetó la planificación de actividades programadas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Los profesores asisten con puntualidad en el horario establecido?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Da a la asignatura un enfoque aplicado ofreciendo ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Los recursos didácticos utilizados te facilitaron el aprendizaje?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Los profesores te ofrecen la posibilidad de plantear tus dudas y dificultades en clase?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t, "TEORÍA: ¿Los docentes explican con claridad los temas desarrollados?", opciones_si_no_npo)

        # Sección E: Actuación de los miembros de la Cátedra (PRÁCTICA)
        seccion_e_p = find_or_create_seccion(db, plantilla_encuesta_basico, "E: Actuación de los miembros de la Cátedra (PRÁCTICA)")
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Se respetó la planificación de actividades programadas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Los profesores asisten con puntualidad en el horario establecido?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Da a la asignatura un enfoque aplicado ofreciendo ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Los recursos didácticos utilizados te facilitaron el aprendizaje?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Los profesores te ofrecen la posibilidad de plantear tus dudas y dificultades en clase?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p, "PRÁCTICA: ¿Los docentes explican con claridad los temas desarrollados?", opciones_si_no_npo)
        
        # Sección F: Institucional
        seccion_f = find_or_create_seccion(db, plantilla_encuesta_basico, "F: Institucional")
        crear_pregunta_mc(db, seccion_f, "¿El personal administrativo de la Facultad respondió a tus requerimientos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f, "¿El personal administrativo respondió cordialmente las consultas que realizaste?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f, "¿El servicio de Biblioteca de la sede es adecuado a tus necesidades?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f, "¿El Sistema Sui Guaraní te facilitó la realización de trámites administrativos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f, "¿Consideras que son adecuadas las aulas y el equipamiento de los laboratorios?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f, "¿Te parecen suficientes los recursos informáticos que te ofrece la institución (pe, pc con internet, wifi, etc.)?", opciones_si_no_npo)

        # Sección G: Opinión Global
        seccion_g = find_or_create_seccion(db, plantilla_encuesta_basico, "G: Opinión Global")
        opciones_g1 = ["Muy satisfactorio (4)", "Satisfactorio (3)", "Poco Satisfactorio (2)", "No satisfactorio (1)"]
        crear_pregunta_mc(db, seccion_g, "En general ¿cómo evalúas tu experiencia de aprendizaje en esta asignatura?", opciones_g1)
        crear_pregunta_redaccion(db, seccion_g, "¿Qué aspectos valoras como positivos del cursado de la asignatura? Menciona los que consideres más importantes.")
        crear_pregunta_redaccion(db, seccion_g, "¿Qué aspectos consideras que se pueden mejorar? Menciona los que consideres más importantes.")
        crear_pregunta_redaccion(db, seccion_g, "¿Qué recomendaciones le harías a un compañero que cursará el año que viene la asignatura?")
        
        db.commit() # Commit después de la primera plantilla
        print("   - Plantilla 'Encuesta Alumnos - Ciclo Básico' completada.")


        # --- 2. PLANTILLA: INFORME DE ACTIVIDAD CURRICULAR ---
        # Basado en Informe_de_Actividad_Curricular_2024.doc (ANEXO I RCDFI N 283/2015)
        
        plantilla_informe_curricular = find_or_create_plantilla(
            db=db,
            titulo="Informe de Actividad Curricular (ANEXO I RCDFI 283/2015)",
            descripcion="Informe de cátedra a ser completado por el docente responsable al finalizar el ciclo lectivo.",
            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
            anexo="Anexo I (RCDFI N° 283/2015)",
            estado=EstadoInstrumento.PUBLICADA
        )

        # Sección 1: Necesidades de Equipamiento y Bibliografía
        seccion_1_inf = find_or_create_seccion(db, plantilla_informe_curricular, "1. Necesidades de Equipamiento y Bibliografía")
        crear_pregunta_redaccion(db, seccion_1_inf, "1. Indique necesidades de equipamiento e insumos (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")
        crear_pregunta_redaccion(db, seccion_1_inf, "1. Indique necesidades de actualización de bibliografía (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")

        # Sección 2: Desarrollo de la Actividad Curricular
        seccion_2_inf = find_or_create_seccion(db, plantilla_informe_curricular, "2. Desarrollo de la Actividad Curricular")
        crear_pregunta_redaccion(db, seccion_2_inf, "2. Porcentaje de horas de clases TEÓRICAS dictadas (respecto del total establecido en el plan de estudios) y justificación si es necesario.")
        crear_pregunta_redaccion(db, seccion_2_inf, "2. Porcentaje de horas de clases PRÁCTICAS dictadas (respecto del total establecido en el plan de estudios) y justificación si es necesario.")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.A. Porcentaje de contenidos planificados alcanzados.")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.A. Estrategias a planificar para el próximo dictado a fin de ajustar el cronograma (si es necesario).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.B. Observaciones/Juicio de valor sobre los resultados de la 'Encuesta a Alumnos' (Secciones B, C, D, E).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Aspectos positivos (Proceso Enseñanza).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Aspectos positivos (Proceso de aprendizaje).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Obstáculos (Proceso Enseñanza).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Obstáculos (Proceso de aprendizaje).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Estrategias a implementar (derivadas de Aspectos/Obstáculos).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Resumen de la reflexión sobre la práctica docente y nuevas estrategias a implementar (cambio de cronograma, modificación del proceso de evaluación, etc.).")

        # Sección 3: Actividades del Equipo de Cátedra
        seccion_3_inf = find_or_create_seccion(db, plantilla_informe_curricular, "3. Actividades del Equipo de Cátedra")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Actividades de Capacitación, Investigación, Extensión y Gestión - PROFESORES.")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Actividades de Capacitación, Investigación, Extensión y Gestión - JTP.")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Actividades de Capacitación, Investigación, Extensión y Gestión - AUXILIARES.")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Observaciones y comentarios pertinentes sobre las actividades del equipo.")
        
        # Sección 4: Desempeño de Auxiliares
        seccion_4_inf = find_or_create_seccion(db, plantilla_informe_curricular, "4. Desempeño de Auxiliares")
        crear_pregunta_redaccion(db, seccion_4_inf, "4. Valore el desempeño de los JTP/Auxiliares (E, MB, B, R, I) y justifique (Art. 14 Reglamento Académico).")
        
        db.commit() # Commit después de la segunda plantilla
        print("   - Plantilla 'Informe de Actividad Curricular' completada.")
        
        print("\n¡Seeding de plantillas finalizado exitosamente!")
        
    except Exception as e:
        print(f"\nERROR durante el seeding de plantillas: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def create_tables():
     print("Verificando/Creando tablas si no existen...")
     # Importar todos los módulos que definen modelos
     # para que se registren en ModeloBase.metadata
     try:
        # Importamos en el orden de dependencia (de menos a más dependiente)
        # Esto es una suposición, pero ayuda a SQLAlchemy a registrar
        print("   - Importando modelos base (models, enumerados)...")
        from src.models import ModeloBase
        from src.enumerados import TipoInstrumento, TipoPregunta, EstadoInstrumento

        print("   - Importando respuesta, seccion...")
        from src.respuesta import models as respuesta_models
        from src.seccion import models as seccion_models
        
        print("   - Importando pregunta...")
        from src.pregunta import models as pregunta_models
        
        print("   - Importando persona...")
        from src.persona import models as persona_models
        
        print("   - Importando materia...")
        from src.materia import models as materia_models
        
        print("   - Importando instrumento...")
        from src.instrumento import models as instrumento_models
        
        print("   - Importando encuestas...")
        from src.encuestas import models as encuestas_models
        print("   - Todas las importaciones de modelos completadas.")

     except ImportError as e:
         print(f"Error importando módulos de modelos: {e}")
         print("Asegúrate de que todos los archivos de modelos existen y no tienen errores de sintaxis.")
         sys.exit(1)
         
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")

# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de plantillas (corregido v3)...")
    
    # Asegurarse que las tablas existan
    create_tables()

    db = SessionLocal()
    try:
        seed_plantillas_data(db)
    finally:
        db.close()
        print("Conexión a la base de datos cerrada.")