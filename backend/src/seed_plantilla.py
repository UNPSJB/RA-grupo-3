# backend/src/seed_plantilla.py
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import select

# --- Configuración de Path (para que encuentre 'src') ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir) # Sube un nivel a 'backend'
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# --- Fin Configuración de Path ---

try:
    from src.database import SessionLocal, engine
    from src.models import ModeloBase
    
    # Importar TODOS los módulos que definen modelos 
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


# --- Listas de Opciones Reutilizables (Basadas en el PDF) ---
opciones_si_no_npo = ["Sí", "No", "No puedo opinar (NPO)"]
opciones_satisfaccion_g1 = ["Muy satisfactorio (4)", "Satisfactorio (3)", "Poco Satisfactorio (2)", "No satisfactorio (1)"]
opciones_ciclo_superior = ["Muy Bueno / Muy satisfactorio (4)", "Bueno / Satisfactorio (3)", "Regular / Poco Satisfactorio (2)", "Malo / No Satisfactorio (1)"]

# Opciones para Sección A
opciones_a1 = ["Una", "Más de una"]
opciones_a2_a3 = ["Entre 0 y 50%", "Más 50%"]
opciones_a4 = ["Escasos", "Suficientes"]


# --- Funciones Helper (sin cambios) ---

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
    print("Iniciando seeding de plantillas, secciones y preguntas...")
    
    try:
        # --- 1. PLANTILLA: ENCUESTA ALUMNOS (CICLO BÁSICO - ANEXO I) ---
        
        plantilla_encuesta_basico = find_or_create_plantilla(
            db=db,
            titulo="Encuesta Alumnos - Ciclo Básico (ANEXO I DCDFI 005/2014)",
            descripcion="Instrumento de seguimiento para 1° y 2° año.",
            tipo=TipoInstrumento.ENCUESTA,
            anexo="Anexo I (DCDFI N° 005/2014)",
            estado=EstadoInstrumento.PUBLICADA
        )
        
        # --- SECCIÓN A (CICLO BÁSICO) ---
        seccion_a_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "A: Información General")
        crear_pregunta_mc(db, seccion_a_basico, "¿Cuántas veces te has inscripto para cursar esta asignatura?", opciones_a1)
        crear_pregunta_mc(db, seccion_a_basico, "¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases teóricas?", opciones_a2_a3)
        crear_pregunta_mc(db, seccion_a_basico, "¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases prácticas?", opciones_a2_a3)
        crear_pregunta_mc(db, seccion_a_basico, "Los conocimientos previos para comprender los contenidos de la asignatura fueron:", opciones_a4)

        # Sección B: Comunicación (Sí/No/NPO)
        seccion_b_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "B: Comunicación y desarrollo de la asignatura")
        crear_pregunta_mc(db, seccion_b_basico, "¿El profesor brindó al inicio del curso, información referida al desarrollo de la asignatura (programa, cronograma, régimen de cursada y criterios de evaluación.)?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_b_basico, "¿La bibliografía propuesta por la cátedra estuvo disponible en la biblioteca o centros de documentación?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_b_basico, "¿El profesor ofreció la posibilidad de establecer una buena comunicación en diferentes aspectos de la vida universitaria?", opciones_si_no_npo)

        # Sección C: Metodología (Sí/No/NPO)
        seccion_c_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "C: Metodología")
        crear_pregunta_mc(db, seccion_c_basico, "¿Se propusieron clases de apoyo y consultas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_c_basico, "¿Los contenidos desarrollados en las clases teóricas se correspondieron con los trabajos prácticos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_c_basico, "¿Las clases prácticas de laboratorio te resultaron de utilidad?", opciones_si_no_npo)

        # Sección D: Evaluación (Sí/No/NPO)
        seccion_d_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "D: Evaluación")
        crear_pregunta_mc(db, seccion_d_basico, "¿Hubo relación entre el desarrollo de las clases teóricas y prácticas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_d_basico, "¿Existió relación entre los temas desarrollados en clase y los temas evaluados?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_d_basico, "¿Te brindaron posibilidades para comentar y revisar los resultados de los exámenes parciales?", opciones_si_no_npo)

        # Sección E: Actuación Cátedra (TEORÍA) (Sí/No/NPO)
        seccion_e_t_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "E: Actuación de los miembros de la Cátedra (TEORÍA)")
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Se respetó la planificación de actividades programadas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Los profesores asisten con puntualidad en el horario establecido?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Da a la asignatura un enfoque aplicado ofreciendo ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Los recursos didácticos utilizados te facilitaron el aprendizaje?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Los profesores te ofrecen la posibilidad de plantear tus dudas y dificultades en clase?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_t_basico, "TEORÍA: ¿Los docentes explican con claridad los temas desarrollados?", opciones_si_no_npo)

        # Sección E: Actuación Cátedra (PRÁCTICA) (Sí/No/NPO)
        seccion_e_p_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "E: Actuación de los miembros de la Cátedra (PRÁCTICA)")
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Se respetó la planificación de actividades programadas?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Los profesores asisten con puntualidad en el horario establecido?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Da a la asignatura un enfoque aplicado ofreciendo ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Los recursos didácticos utilizados te facilitaron el aprendizaje?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Los profesores te ofrecen la posibilidad de plantear tus dudas y dificultades en clase?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_e_p_basico, "PRÁCTICA: ¿Los docentes explican con claridad los temas desarrollados?", opciones_si_no_npo)
        
        # Sección F: Institucional (Sí/No/NPO)
        seccion_f_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "F: Institucional")
        crear_pregunta_mc(db, seccion_f_basico, "¿El personal administrativo de la Facultad respondió a tus requerimientos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f_basico, "¿El personal administrativo respondió cordialmente las consultas que realizaste?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f_basico, "¿El servicio de Biblioteca de la sede es adecuado a tus necesidades?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f_basico, "¿El Sistema Sui Guaraní te facilitó la realización de trámites administrativos?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f_basico, "¿Consideras que son adecuadas las aulas y el equipamiento de los laboratorios?", opciones_si_no_npo)
        crear_pregunta_mc(db, seccion_f_basico, "¿Te parecen suficientes los recursos informáticos que te ofrece la institución (pe, pc con internet, wifi, etc.)?", opciones_si_no_npo)

        # Sección G: Opinión Global (¡Escala 4-1!)
        seccion_g_basico = find_or_create_seccion(db, plantilla_encuesta_basico, "G: Opinión Global")
        crear_pregunta_mc(db, seccion_g_basico, "En general ¿cómo evalúas tu experiencia de aprendizaje en esta asignatura?", opciones_satisfaccion_g1)
        crear_pregunta_redaccion(db, seccion_g_basico, "¿Qué aspectos valoras como positivos del cursado de la asignatura? Menciona los que consideres más importantes.")
        crear_pregunta_redaccion(db, seccion_g_basico, "¿Qué aspectos consideras que se pueden mejorar? Menciona los que consideres más importantes.")
        crear_pregunta_redaccion(db, seccion_g_basico, "¿Qué recomendaciones le harías a un compañero que cursará el año que viene la asignatura?")
        
        db.commit()
        print("   - Plantilla 'Encuesta Alumnos - Ciclo Básico' completada.")


        # --- 2. PLANTILLA: ENCUESTA ALUMNOS (CICLO SUPERIOR - ANEXO II) ---
        
        plantilla_encuesta_superior = find_or_create_plantilla(
            db=db,
            titulo="Encuesta Alumnos - Ciclo Superior (ANEXO II DCDFI 005/2014)",
            descripcion="Instrumento de seguimiento para 3°, 4° y 5° año.",
            tipo=TipoInstrumento.ENCUESTA,
            anexo="Anexo II (DCDFI N° 005/2014)",
            estado=EstadoInstrumento.PUBLICADA
        )

        # --- SECCIÓN A (CICLO SUPERIOR) ---
        seccion_a_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "A: Información General")
        crear_pregunta_mc(db, seccion_a_sup, "¿Cuántas veces te has inscripto para cursar esta asignatura?", opciones_a1)
        crear_pregunta_mc(db, seccion_a_sup, "¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases teóricas?", opciones_a2_a3)
        crear_pregunta_mc(db, seccion_a_sup, "¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases prácticas?", opciones_a2_a3)
        crear_pregunta_mc(db, seccion_a_sup, "Los conocimientos previos para comprender los contenidos de la asignatura fueron:", opciones_a4)

        # --- SECCIONES B-G (CICLO SUPERIOR - Escala 4-1) ---
        seccion_b_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "B: Comunicación y desarrollo de la asignatura")
        crear_pregunta_mc(db, seccion_b_sup, "El profesor brindó al inicio del curso, información referida al desarrollo de la asignatura (programa, cronograma, régimen de cursada y criterios de evaluación.)", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_b_sup, "Se respetó la planificación de las actividades programadas al inicio del cursado y el calendario académico.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_b_sup, "La bibliografía propuesta por la cátedra estuvo disponible en la biblioteca o centros de documentación.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_b_sup, "El profesor ofreció la posibilidad de establecer una buena comunicación en diferentes aspectos de la vida universitaria.", opciones_ciclo_superior)

        seccion_c_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "C: Metodología")
        crear_pregunta_mc(db, seccion_c_sup, "Se propusieron clases de apoyo y consulta.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_c_sup, "Existe relación entre los contenidos desarrollados en las clases teóricas y los trabajos prácticos.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_c_sup, "Las clases prácticas de laboratorio resultaron de utilidad para la compresión de los contenidos.", opciones_ciclo_superior)

        seccion_d_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "D: Evaluación")
        crear_pregunta_mc(db, seccion_d_sup, "Las clases teóricas y las clases prácticas tuvieron correlación.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_d_sup, "La profundidad de los temas tratados en las clases teóricas y prácticas es equivalente al nivel de exigencia en las evaluaciones.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_d_sup, "La revisión de evaluaciones o trabajos presentados resulta una instancia para mejorar la compresión de los contenidos.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_d_sup, "Las alternativas de evaluación propuestos por la cátedra (Promoción directa, informes, trabajos prácticos, monografías, etc.) te resultaron convenientes para el aprendizaje.", opciones_ciclo_superior)
        
        seccion_e_t_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "E: Actuación de los miembros de la Cátedra (TEORÍA)")
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: Se respetó la planificación de actividades programadas.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: El profesor/es asistió/asistieron a clases en el horario establecido.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: Se presentaron aplicaciones, ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional en el desarrollo de las clases.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: Los recursos didácticos utilizados facilitaron el aprendizaje.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: Los profesores ofrecen la posibilidad de plantear dudas y dificultades en la comprensión de los temas.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_t_sup, "TEORÍA: Los temas desarrollados son explicados con claridad.", opciones_ciclo_superior)

        seccion_e_p_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "E: Actuación de los miembros de la Cátedra (PRÁCTICA)")
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: Se respetó la planificación de actividades programadas.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: El profesor/es asistió/asistieron a clases en el horario establecido.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: Se presentaron aplicaciones, ejemplos, demostraciones, formas de transferencias a la vida cotidiana y profesional en el desarrollo de las clases.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: Los recursos didácticos utilizados facilitaron el aprendizaje.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: Los profesores ofrecen la posibilidad de plantear dudas y dificultades en la comprensión de los temas.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_e_p_sup, "PRÁCTICA: Los temas desarrollados son explicados con claridad.", opciones_ciclo_superior)

        seccion_f_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "F: Institucional")
        crear_pregunta_mc(db, seccion_f_sup, "El personal administrativo de la Facultad da respuestas a tus requerimientos.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_f_sup, "El personal administrativo respondió cordialmente a tus consultas.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_f_sup, "El servicio de Biblioteca es adecuado a tus necesidades.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_f_sup, "El Sistema Sui Guaraní te facilitó la realización de trámites administrativos.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_f_sup, "Las aulas y el equipamiento de los laboratorios son apropiados.", opciones_ciclo_superior)
        crear_pregunta_mc(db, seccion_f_sup, "Los recursos informáticos que ofrece la institución (pc, pc con Internet. wifi, etc.) son adecuados a tus necesidades.", opciones_ciclo_superior)

        seccion_g_sup = find_or_create_seccion(db, plantilla_encuesta_superior, "G: Opinión Global")
        crear_pregunta_mc(db, seccion_g_sup, "En general ¿cómo evalúas tu experiencia de aprendizaje en esta asignatura?", opciones_ciclo_superior)
        crear_pregunta_redaccion(db, seccion_g_sup, "¿Qué aspectos valoras como positivos en los procesos de enseñanza aprendizaje de la asignatura? Menciona los que consideres importantes.")
        crear_pregunta_redaccion(db, seccion_g_sup, "¿Qué aspectos consideras que se pueden mejorar para la enseñanza aprendizaje de la asignatura?")

        db.commit()
        print("   - Plantilla 'Encuesta Alumnos - Ciclo Superior' completada.")


        # --- 3. PLANTILLA: INFORME DE ACTIVIDAD CURRICULAR (Sin cambios) ---
        
        plantilla_informe_curricular = find_or_create_plantilla(
            db=db,
            titulo="Informe de Actividad Curricular (ANEXO I RCDFI 283/2015)",
            descripcion="Informe de cátedra a ser completado por el docente responsable al finalizar el ciclo lectivo.",
            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
            anexo="Anexo I (RCDFI N° 283/2015)",
            estado=EstadoInstrumento.PUBLICADA
        )

        seccion_1_inf = find_or_create_seccion(db, plantilla_informe_curricular, "1. Necesidades de Equipamiento y Bibliografía")
        crear_pregunta_redaccion(db, seccion_1_inf, "1. Indique necesidades de equipamiento e insumos (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")
        crear_pregunta_redaccion(db, seccion_1_inf, "1. Indique necesidades de actualización de bibliografía (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")

        seccion_2_inf = find_or_create_seccion(db, plantilla_informe_curricular, "2. Desarrollo de la Actividad Curricular")
        crear_pregunta_redaccion(db, seccion_2_inf, "2. Porcentaje de horas de clases TEÓRICAS dictadas (respecto del total establecido en el plan de estudios) y justificación si es necesario.")
        # ... (el resto de las preguntas de redacción del informe) ...
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. Resumen de la reflexión sobre la práctica docente y nuevas estrategias a implementar (cambio de cronograma, modificación del proceso de evaluación, etc.).")

        seccion_3_inf = find_or_create_seccion(db, plantilla_informe_curricular, "3. Actividades del Equipo de Cátedra")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Actividades de Capacitación, Investigación, Extensión y Gestión - PROFESORES.")
        # ... (el resto de las preguntas de redacción del informe) ...
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Observaciones y comentarios pertinentes sobre las actividades del equipo.")
        
        seccion_4_inf = find_or_create_seccion(db, plantilla_informe_curricular, "4. Desempeño de Auxiliares")
        crear_pregunta_redaccion(db, seccion_4_inf, "4. Valore el desempeño de los JTP/Auxiliares (E, MB, B, R, I) y justifique (Art. 14 Reglamento Académico).")
        
        db.commit()
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
     try:
        from src.models import ModeloBase
        from src.enumerados import TipoInstrumento, TipoPregunta, EstadoInstrumento
        from src.respuesta import models as respuesta_models
        from src.seccion import models as seccion_models
        from src.pregunta import models as pregunta_models
        from src.persona import models as persona_models
        from src.materia import models as materia_models
        from src.instrumento import models as instrumento_models
        from src.encuestas import models as encuestas_models
     except ImportError as e:
         print(f"Error importando módulos de modelos: {e}")
         sys.exit(1)
         
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de plantillas (Versión corregida)...")
    
    # 1. Asegurarse que las tablas existan
    create_tables()

    # 2. Obtener sesión de BBDD
    db = SessionLocal()
    try:
        # 3. Ejecutar la lógica de seeding
        seed_plantillas_data(db)
    finally:
        db.close()
        print("Conexión a la base de datos cerrada.")