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
# --- Fin Configuración de Path ---

try:
    from src.database import SessionLocal
    # --- Models ---
    from src.materia.models import Cursada
    from src.encuestas.models import Encuesta, EncuestaInstancia
    from src.instrumento.models import ActividadCurricular, ActividadCurricularInstancia
    from src.pregunta.models import PreguntaMultipleChoice
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

# --- BANCO DE RESPUESTAS "INTELIGENTES" ---
RESPUESTAS_TEXTO = {
    "general": [
        "El desarrollo de la asignatura fue normal, logrando cumplir con el cronograma previsto.",
        "Se observó un buen nivel académico en los alumnos, aunque la deserción fue alta al inicio.",
        "El dictado de la materia se realizó sin inconvenientes mayores, salvo algunos feriados que obligaron a reprogramar.",
        "Curso con alumnos muy participativos. Se lograron todos los objetivos pedagógicos."
    ],
    "equipamiento": [
        "El cañón del aula 105 presenta fallas de color, se solicita revisión técnica.",
        "El laboratorio cuenta con PCs suficientes, pero algunas requieren actualización de software.",
        "No hubo inconvenientes con el equipamiento e infraestructura.",
        "Sería ideal contar con pizarras más grandes en las aulas del edificio nuevo."
    ],
    "bibliografia": [
        "La bibliografía está actualizada y disponible en biblioteca.",
        "Se recomienda adquirir más ejemplares del libro base de la unidad 3.",
        "Los alumnos utilizaron mayormente el material digital provisto por la cátedra."
    ],
    "dificultades": [
        "La principal dificultad fue la falta de conocimientos previos en matemática.",
        "Hubo superposición de horarios con materias correlativas.",
        "Ninguna dificultad significativa.",
        "La conexión a internet en el aula fue inestable durante las evaluaciones."
    ],
    "alumnos": [
        "Se inscribieron 45 alumnos, de los cuales regularizaron 30.",
        "Grupo heterogéneo, pero con buena predisposición al trabajo grupal.",
        "Cantidad de inscriptos acorde a lo esperado."
    ]
}

def obtener_respuesta_texto_smart(texto_pregunta: str) -> str:
    """Devuelve una respuesta coherente basada en palabras clave de la pregunta."""
    txt = texto_pregunta.lower()
    
    if "equipamiento" in txt or "infraestructura" in txt or "aula" in txt:
        return random.choice(RESPUESTAS_TEXTO["equipamiento"])
    elif "bibliograf" in txt:
        return random.choice(RESPUESTAS_TEXTO["bibliografia"])
    elif "dificultad" in txt or "inconveniente" in txt or "problema" in txt:
        return random.choice(RESPUESTAS_TEXTO["dificultades"])
    elif "alumno" in txt or "inscripto" in txt:
        return random.choice(RESPUESTAS_TEXTO["alumnos"])
    else:
        # Respuesta default genérica (Síntesis o comentarios generales)
        return random.choice(RESPUESTAS_TEXTO["general"])

def obtener_opcion_smart(pregunta: PreguntaMultipleChoice) -> int:
    """Intenta elegir una opción 'positiva' o realista."""
    opciones = pregunta.opciones
    if not opciones:
        return None
        
    # Tratamos de buscar opciones que indiquen completitud o buen desempeño
    opciones_preferidas = []
    
    for op in opciones:
        txt = op.texto.lower()
        # Preferir porcentajes altos
        if "100" in txt or "75" in txt or "total" in txt:
            opciones_preferidas.append(op)
        # Preferir calificaciones altas
        elif "muy bueno" in txt or "excelente" in txt or "bueno" in txt:
            opciones_preferidas.append(op)
        # Preferir "Si" o "Adecuado"
        elif txt == "si" or "adecuado" in txt or "completo" in txt:
            opciones_preferidas.append(op)

    if opciones_preferidas:
        return random.choice(opciones_preferidas).id
    else:
        # Si no hay preferidas, devolvemos cualquiera random
        return random.choice(opciones).id


def seed_completar_informes(db: Session):
    print("Iniciando script para completar informes con datos REALISTAS...")

    # --- PARTE 1: Asegurar que existan ACIs en estado PENDIENTE ---
    print("\n--- Parte 1: Generando informes PENDIENTES (Cierre de encuestas)...")
    
    plantilla_encuesta_id = db.scalars(
        select(Encuesta.id).where(Encuesta.tipo == TipoInstrumento.ENCUESTA).limit(1)
    ).first()
    
    if not plantilla_encuesta_id:
        print("ERROR: Falta plantilla Encuesta. Ejecuta seed_plantilla.py.")
        return

    cursadas = db.scalars(select(Cursada)).all()
    instancias_activas = []
    
    for cursada in cursadas:
        instancia_encuesta = db.scalars(
            select(EncuestaInstancia).where(EncuestaInstancia.cursada_id == cursada.id)
        ).first()
        
        if not instancia_encuesta:
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

    count_pendientes = 0
    for instancia in instancias_activas:
        try:
            encuestas_services.cerrar_instancia_encuesta(db, instancia_id=instancia.id)
            count_pendientes += 1
        except Exception:
            pass # Ignoramos si ya estaba creado

    print(f"   -> Se aseguraron informes pendientes.")

    # --- PARTE 2: Completar los informes PENDIENTES ---
    print("\n--- Parte 2: Completando informes PENDIENTES con Respuestas SMART...")
    
    # 2.1 Buscar plantilla y cargar preguntas
    plantilla_aci = db.scalars(
        select(ActividadCurricular)
        .where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR)
        .options(
            selectinload(ActividadCurricular.secciones)
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones)
        )
    ).first()

    if not plantilla_aci:
        print("ERROR: Falta plantilla Actividad Curricular.")
        return

    todas_las_preguntas = []
    for seccion in plantilla_aci.secciones:
        todas_las_preguntas.extend(seccion.preguntas)

    # 2.2 Buscar informes pendientes
    informes_pendientes = db.scalars(
        select(ActividadCurricularInstancia)
        .where(ActividadCurricularInstancia.estado == EstadoInforme.PENDIENTE)
    ).all()

    if not informes_pendientes:
        print("   - No hay informes pendientes para completar.")
        return

    print(f"   - Procesando {len(informes_pendientes)} informes...")
    
    for informe in informes_pendientes:
        respuestas_simuladas = []
        try:
            for pregunta in todas_las_preguntas:
                # LÓGICA SMART AQUÍ
                if pregunta.tipo == TipoPregunta.REDACCION:
                    texto_smart = obtener_respuesta_texto_smart(pregunta.texto)
                    respuestas_simuladas.append(
                        RespuestaIndividualCreate(
                            pregunta_id=pregunta.id,
                            texto=texto_smart
                        )
                    )
                elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    opcion_id = obtener_opcion_smart(pregunta)
                    if opcion_id:
                        respuestas_simuladas.append(
                            RespuestaIndividualCreate(
                                pregunta_id=pregunta.id,
                                opcion_id=opcion_id
                            )
                        )
            
            payload = RespuestaSetCreate(respuestas=respuestas_simuladas)
            
            respuesta_services.crear_submission_profesor(
                db=db,
                instancia_id=informe.id,
                profesor_id=informe.profesor_id,
                respuestas_data=payload
            )
            print(f"   + [OK] Informe {informe.id} completado con datos realistas.")
            
        except Exception as e:
            print(f"   - [ERROR] Informe {informe.id}: {e}")
            db.rollback()

    print("--- Fin del proceso ---")

if __name__ == "__main__":
    db = SessionLocal()
    seed_completar_informes(db)
    db.close()