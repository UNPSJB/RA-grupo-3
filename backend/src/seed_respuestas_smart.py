import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import select

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

try:
    from src.database import SessionLocal
    from src.materia.models import Cursada, Cuatrimestre
    from src.instrumento.models import ActividadCurricular, ActividadCurricularInstancia
    from src.pregunta.models import PreguntaMultipleChoice
    from src.seccion.models import Seccion
    from src.enumerados import EstadoInforme, TipoInstrumento, TipoPregunta
    from src.respuesta import services as respuesta_services
    from src.respuesta.schemas import RespuestaSetCreate, RespuestaIndividualCreate
except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

def generar_texto_inteligente(seccion_nombre: str, materia_nombre: str) -> str:
    """
    Genera un texto que permite identificar fácilmente de qué sección y materia viene.
    Esto es clave para probar el botón 'Traer Respuestas'.
    """
    prefijo = seccion_nombre.split(" ")[0] # Ej: "1.", "2.A", "3."
    
    if seccion_nombre.startswith("0."):
        return f"[{materia_nombre}] Información general verificada y correcta."
    
    if seccion_nombre.startswith("1."):
        return f"[{materia_nombre}] Solicitamos actualización de licencias de software y 2 proyectores nuevos para el aula."
    
    if seccion_nombre.startswith("2.A"):
        return f"[{materia_nombre}] Se cubrió el 100% de los contenidos. Estrategia: Aumentar carga práctica."
    
    if seccion_nombre.startswith("2.B"):
        return f"[{materia_nombre}] Los alumnos valoraron positivamente la metodología. Se observa baja participación en teoría."
    
    if seccion_nombre.startswith("2.C"):
        return f"[{materia_nombre}] Aspecto positivo: Uso de laboratorio. Obstáculo: Cortes de luz."
    
    if seccion_nombre.startswith("2."): # Desarrollo general (sección 2 a secas)
        return f"[{materia_nombre}] Se dictaron 90 horas de clase. Cumplimiento del cronograma normal."

    if seccion_nombre.startswith("3."):
        return f"[{materia_nombre}] El equipo realizó curso de actualización en IA y publicó 2 papers en congreso WICC."
    
    if seccion_nombre.startswith("4."):
        return f"[{materia_nombre}] Desempeño de auxiliares: Excelente. Gran compromiso con los alumnos."
    
    if seccion_nombre.startswith("5."):
        return f"[{materia_nombre}] Observación final: Se requiere mayor coordinación con materias correlativas."

    return f"[{materia_nombre}] Respuesta genérica para {seccion_nombre}."

def seed_respuestas_smart(db: Session):
    print("\n🤖 Iniciando llenado inteligente de informes para testing...")

    # 1. Obtener la plantilla de Actividad Curricular
    plantilla = db.scalars(
        select(ActividadCurricular)
        .where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR)
        .options(
            selectinload(ActividadCurricular.secciones)
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones)
        )
    ).first()

    if not plantilla:
        print("❌ Error: No hay plantilla de Actividad Curricular.")
        return

    # 2. Buscar 3 Informes PENDIENTES del año actual (2025)
    # Si no hay pendientes, buscará cualquiera para 'pisar' datos y que sirva para el test
    anio_actual = datetime.now().year
    if anio_actual < 2025: anio_actual = 2025 # Forzar 2025 si el sistema tiene fecha vieja

    stmt = (
        select(ActividadCurricularInstancia)
        .join(Cursada)
        .join(Cuatrimestre)
        .where(
            ActividadCurricularInstancia.estado == EstadoInforme.PENDIENTE,
            Cuatrimestre.anio == anio_actual
        )
        .options(selectinload(ActividadCurricularInstancia.cursada).selectinload(Cursada.materia))
        .limit(3)
    )
    
    informes = db.scalars(stmt).all()

    if not informes:
        print(f"⚠️ No se encontraron informes PENDIENTES para {anio_actual}.")
        print("   (Asegúrate de haber ejecutado 'seed_data.py' y haber generado/cerrado encuestas primero)")
        return

    print(f"✅ Se encontraron {len(informes)} informes pendientes. Procesando...")

    # 3. Completar cada informe
    for informe in informes:
        materia_nombre = informe.cursada.materia.nombre
        print(f"   📝 Completando informe para: {materia_nombre}...")
        
        respuestas_data = []

        # Recorrer secciones y preguntas de la plantilla
        for seccion in plantilla.secciones:
            for pregunta in seccion.preguntas:
                
                if pregunta.tipo == TipoPregunta.REDACCION:
                    # Generar texto inteligente basado en la sección
                    texto_respuesta = generar_texto_inteligente(seccion.nombre, materia_nombre)
                    
                    respuestas_data.append(RespuestaIndividualCreate(
                        pregunta_id=pregunta.id,
                        texto=texto_respuesta
                    ))
                
                elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    # Elegir una opción al azar para cumplir validación
                    if pregunta.opciones:
                        opcion = random.choice(pregunta.opciones)
                        respuestas_data.append(RespuestaIndividualCreate(
                            pregunta_id=pregunta.id,
                            opcion_id=opcion.id
                        ))

        # 4. Enviar respuestas usando el servicio
        try:
            payload = RespuestaSetCreate(respuestas=respuestas_data)
            
            respuesta_services.crear_submission_profesor(
                db=db,
                instancia_id=informe.id,
                profesor_id=informe.profesor_id,
                respuestas_data=payload
            )
            print(f"      -> Informe enviado y completado correctamente.")
            
        except Exception as e:
            print(f"      ❌ Error al guardar respuestas: {e}")
            db.rollback()

    print("\n✨ Proceso finalizado. Ahora puedes ir al Panel de Departamento y Generar el Informe Sintético.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_respuestas_smart(db)
    finally:
        db.close()