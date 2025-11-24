{
type: "uploaded file",
fileName: "unpsjb/ra-grupo-3/RA-grupo-3-dev/backend/src/seed_plantilla.py",
fullContent: `import sys
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
    from src.instrumento.models import InstrumentoBase, ActividadCurricular, InformeSintetico
    from src.encuestas.models import Encuesta 
    from src.seccion.models import Seccion
    from src.pregunta.models import Pregunta, PreguntaRedaccion, PreguntaMultipleChoice, Opcion
    from src.enumerados import TipoInstrumento, TipoPregunta, EstadoInstrumento
except ImportError as e:
    print(f"Error: No se pudieron importar los módulos. Asegúrate de que estás en el directorio 'backend'.")
    print(f"Detalle: {e}")
    print(f"Sys.path actual: {sys.path}")
    sys.exit(1)


# --- Listas de Opciones Reutilizables ---
opciones_si_no_npo = ["Sí", "No", "No puedo opinar (NPO)"]
opciones_satisfaccion_g1 = ["Muy satisfactorio (4)", "Satisfactorio (3)", "Poco Satisfactorio (2)", "No satisfactorio (1)"]
opciones_ciclo_superior = ["Muy Bueno / Muy satisfactorio (4)", "Bueno / Satisfactorio (3)", "Regular / Poco Satisfactorio (2)", "Malo / No Satisfactorio (1)"]
opciones_a1 = ["Una", "Más de una"]
opciones_a2_a3 = ["Entre 0 y 50%", "Más 50%"]
opciones_a4 = ["Escasos", "Suficientes"]

# --- Funciones Helper (sin cambios) ---

def find_or_create_plantilla(db: Session, titulo: str, descripcion: str, tipo: TipoInstrumento, anexo: str, estado: EstadoInstrumento) -> InstrumentoBase:
    stmt = select(InstrumentoBase).where(InstrumentoBase.titulo == titulo)
    plantilla = db.scalars(stmt).first()
    
    if plantilla:
        print(f"   - Plantilla encontrada: '{titulo}' (ID: {plantilla.id})")
        estado_correcto = estado.value
        if plantilla.estado is None or plantilla.estado.lower() != estado_correcto.lower():
            print(f"     -> ACTUALIZANDO estado de '{plantilla.estado}' a '{estado_correcto}'")
            plantilla.estado = estado_correcto
            db.add(plantilla)
            db.commit()
            db.refresh(plantilla)
        return plantilla
    
    print(f"   + Creando plantilla: '{titulo}'")
    
    if tipo == TipoInstrumento.ENCUESTA:
        plantilla = Encuesta(titulo=titulo, descripcion=descripcion, anexo=anexo, estado=estado.value)
    elif tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR:
        plantilla = ActividadCurricular(titulo=titulo, descripcion=descripcion, anexo=anexo, estado=estado.value)
    elif tipo == TipoInstrumento.INFORME_SINTETICO:
        plantilla = InformeSintetico(titulo=titulo, descripcion=descripcion, anexo=anexo, estado=estado.value)
    else:
        raise ValueError(f"Tipo de instrumento no manejado: {tipo}")
        
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla

def find_or_create_seccion(db: Session, instrumento: InstrumentoBase, nombre_seccion: str) -> Seccion:
    stmt = select(Seccion).where(Seccion.instrumento_id == instrumento.id, Seccion.nombre == nombre_seccion)
    seccion = db.scalars(stmt).first()
    if seccion: return seccion
    seccion = Seccion(nombre=nombre_seccion, instrumento_id=instrumento.id)
    db.add(seccion)
    db.commit()
    db.refresh(seccion)
    return seccion

def crear_pregunta_mc(db: Session, seccion: Seccion, texto_pregunta: str, opciones_texto: list[str]):
    stmt = select(Pregunta).where(Pregunta.seccion_id == seccion.id, Pregunta.texto == texto_pregunta)
    if db.scalars(stmt).first(): return
    
    opciones_obj = [Opcion(texto=texto) for texto in opciones_texto]
    nueva_pregunta = PreguntaMultipleChoice(
        texto=texto_pregunta, tipo=TipoPregunta.MULTIPLE_CHOICE, seccion_id=seccion.id, opciones=opciones_obj
    )
    db.add(nueva_pregunta)

def crear_pregunta_redaccion(db: Session, seccion: Seccion, texto_pregunta: str, origen_datos: str|None=None):
    stmt = select(Pregunta).where(Pregunta.seccion_id == seccion.id, Pregunta.texto == texto_pregunta)
    if db.scalars(stmt).first(): return
    
    nueva_pregunta = PreguntaRedaccion(
        texto=texto_pregunta, tipo=TipoPregunta.REDACCION, seccion_id=seccion.id, origen_datos=origen_datos
    )
    db.add(nueva_pregunta)

# --- Función Principal de Seeding ---

def seed_plantillas_data(db: Session):
    print("Iniciando seeding de plantillas...")
    
    try:
        # 1. ENCUESTA ALUMNOS BASICO
        plantilla_encuesta_basico = find_or_create_plantilla(
            db=db, titulo="Encuesta Alumnos - Ciclo Básico (ANEXO I DCDFI 005/2014)",
            descripcion="Instrumento de seguimiento para 1° y 2° año.",
            tipo=TipoInstrumento.ENCUESTA, anexo="Anexo I (DCDFI N° 005/2014)", estado=EstadoInstrumento.PUBLICADA
        )
        # ... (Secciones A-G iguales al original, omitidas por brevedad) ...
        # Para simplificar, asumimos que ya existen o se crean igual que antes.
        # Si necesitas el código completo de encuestas, manten el original. 
        # Aquí nos enfocamos en la ACTIVIDAD CURRICULAR que cambia.

        # --- 3. PLANTILLA: INFORME DE ACTIVIDAD CURRICULAR (MODIFICADO) ---

        plantilla_informe_curricular = find_or_create_plantilla(
            db=db,
            titulo="Informe de Actividad Curricular (ANEXO I RCDFI 283/2015)",
            descripcion="Informe de cátedra a ser completado por el docente responsable al finalizar el ciclo lectivo.",
            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
            anexo="Anexo I (RCDFI N° 283/2015)",
            estado=EstadoInstrumento.PUBLICADA
        )

        seccion_1_inf = find_or_create_seccion(db, plantilla_informe_curricular, "1. Necesidades de Equipamiento y Bibliografía")
        crear_pregunta_redaccion(db, seccion_1_inf, "Indique necesidades de equipamiento e insumos (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")
        crear_pregunta_redaccion(db, seccion_1_inf, "Indique necesidades de actualización de bibliografía (Verifique si lo solicitado en años anteriores ya se encuentra disponible).")

        seccion_2_inf = find_or_create_seccion(db, plantilla_informe_curricular, "2. Desarrollo de la Actividad Curricular")
        
        # --- CAMBIO IMPORTANTE: AHORA SON REDACCIÓN ---
        # Esto permite guardar "Porcentaje || Justificación"
        # Usamos 'origen_datos' para decirle al frontend qué opciones mostrar en el dropdown
        crear_pregunta_redaccion(db, seccion_2_inf, "2. Porcentaje de horas de clases TEÓRICAS dictadas", origen_datos="dropdown_porcentaje_justificacion")
        crear_pregunta_redaccion(db, seccion_2_inf, "2. Porcentaje de horas de clases PRÁCTICAS dictadas", origen_datos="dropdown_porcentaje_justificacion")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.A. Porcentaje de contenidos planificados alcanzados", origen_datos="dropdown_porcentaje_justificacion")
        
        # El resto sigue igual
        crear_pregunta_redaccion(db, seccion_2_inf, "2.B. Consigne los valores que figuran en el reporte de la Encuesta a alumnos (B, C, D, E) y emita un juicio de valor u observaciones si lo considera oportuno.", origen_datos="resultados_encuesta")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. ¿Cuáles fueron los principales aspectos positivos y los obstáculos que se manifestaron durante el desarrollo del espacio curricular? (Centrándose en Proceso Enseñanza, Proceso de aprendizaje y Estrategias a implementar).")
        crear_pregunta_redaccion(db, seccion_2_inf, "2.C. (Continuación) Escriba un resumen de la reflexión sobre la práctica docente que se realizó en la reunión de equipo de cátedra. En caso de corresponder, consigne nuevas estrategias a implementar (cambio de cronograma, modificación del proceso de evaluación, etc.).")

        seccion_3_inf = find_or_create_seccion(db, plantilla_informe_curricular, "3. Actividades del Equipo de Cátedra")
        crear_pregunta_redaccion(db, seccion_3_inf, "3. Consigne las actividades de Capacitación, Investigación, Extensión y Gestión desarrolladas por los integrantes de la cátedra (Profesores, JTP y Auxiliares). Explicite las observaciones y comentarios que considere pertinentes.")
        
        seccion_4_inf = find_or_create_seccion(db, plantilla_informe_curricular, "4. Desempeño de Auxiliares")
        crear_pregunta_redaccion(db, seccion_4_inf, "4. Valore el desempeño de los JTP/Auxiliares (E, MB, B, R, I) y justifique (Art. 14 Reglamento Académico).")
        
        db.commit()
        print("   - Plantilla 'Informe de Actividad Curricular' (ACTUALIZADA) completada.")
        
        # --- 4. INFORME SINTÉTICO (Igual) ---
        # ... (se mantiene igual que en tu archivo anterior) ...

        print("\n¡Seeding de plantillas finalizado exitosamente!")
        
    except Exception as e:
        print(f"\nERROR durante el seeding de plantillas: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def create_tables():
     ModeloBase.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    db = SessionLocal()
    seed_plantillas_data(db)
    db.close()
`
}