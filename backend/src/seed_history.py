import sys
import os
import random
from datetime import datetime, timedelta

# --- Configuración de Path para que funcione como script independiente ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# -----------------------------------------------------------------------

from sqlalchemy.orm import selectinload
from src.database import SessionLocal
from src.enumerados import TipoCuatrimestre, EstadoInstancia, TipoInstrumento, EstadoInstrumento, TipoPregunta, EstadoInforme
from src.materia.models import Materia, Cuatrimestre, Cursada
from src.persona.models import Profesor, Alumno, Inscripcion
from src.encuestas.models import EncuestaInstancia, Encuesta
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular
from src.seccion.models import Seccion
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion

# --- BANCO DE DATOS "REALISTAS" ---
FRASES_ACADEMICAS = [
    "El nivel académico del grupo fue heterogéneo, con un tercio del curso mostrando dificultades en los conceptos base de lógica.",
    "Se cumplió con el 90% del cronograma previsto. Los alumnos mostraron gran interés en la unidad de POO.",
    "El rendimiento en los parciales fue superior al promedio histórico. Se nota una mejor preparación previa.",
    "Tuvimos que extender las clases de consulta debido a la complejidad del Trabajo Práctico Integrador.",
    "La deserción fue alta después del primer parcial, algo que debemos analizar con el departamento.",
    "Excelente participación en clases teóricas. Grupo muy proactivo y curioso.",
    "Se detectaron dificultades graves en la expresión escrita y redacción de informes técnicos."
]

FRASES_INFRAESTRUCTURA = [
    "El proyector del aula 4 funcionó intermitentemente, lo que dificultó las clases teóricas.",
    "Las computadoras del laboratorio necesitan actualización de RAM urgente para correr los IDEs actuales.",
    "El aula asignada quedó chica para la cantidad de inscriptos iniciales. Tuvimos alumnos sentados en el suelo.",
    "Buena conectividad WiFi este año, lo que facilitó las demos en vivo.",
    "Sin novedades. El equipamiento fue suficiente y funcionó correctamente."
]

FRASES_GENERICAS = [
    "Todo se desarrolló según lo planificado.",
    "No hay observaciones particulares para este período.",
    "Se sugiere revisar la correlatividad con la materia anterior.",
    "El acompañamiento de los auxiliares fue fundamental para el éxito de la cursada."
]

def obtener_respuesta_smart(pregunta_texto: str) -> str:
    """Selecciona una respuesta coherente basada en palabras clave de la pregunta."""
    texto = pregunta_texto.lower()
    
    if "infraestructura" in texto or "equipamiento" in texto or "aula" in texto:
        return random.choice(FRASES_INFRAESTRUCTURA)
    
    if "alumno" in texto or "rendimiento" in texto or "académico" in texto or "deserción" in texto:
        return random.choice(FRASES_ACADEMICAS)
    
    return random.choice(FRASES_GENERICAS)

def seed_history(db):
    print("\n🌱 Iniciando generación de Historial Académico 'Smart' (2022-2024)...")

    # 1. Cargar datos base
    profesores = db.query(Profesor).all()
    alumnos = db.query(Alumno).all()
    
    # Cargar plantillas con todas sus relaciones necesarias
    plantilla_encuesta = db.query(Encuesta).options(
        selectinload(Encuesta.secciones).selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)).selectinload(PreguntaMultipleChoice.opciones)
    ).filter(Encuesta.estado == EstadoInstrumento.PUBLICADA).first()

    plantilla_informe = db.query(ActividadCurricular).options(
        selectinload(ActividadCurricular.secciones).selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)).selectinload(PreguntaMultipleChoice.opciones)
    ).filter(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR).first()

    if not profesores or not alumnos or not plantilla_encuesta or not plantilla_informe:
        print("❌ Faltan datos base (profesores, alumnos o plantillas). Corre seed_data.py primero.")
        return

    # Mapa de materias para dar consistencia (siempre las mismas materias a los mismos profes)
    # Ajusta los nombres según lo que tengas en tu seed_data.py
    materias_asignadas = {
        profesores[0].id: ["Programación I", "Bases de Datos I"],
        profesores[1].id: ["Ingeniería de Software", "Sistemas Operativos"] if len(profesores) > 1 else [],
        profesores[2].id: ["Matemática Discreta"] if len(profesores) > 2 else []
    }

    anios = [2022, 2023, 2024]
    
    informes_creados = 0

    for anio in anios:
        print(f"   📅 Procesando Año {anio}...")
        
        # Crear Cuatrimestre si no existe
        cuatri = db.query(Cuatrimestre).filter_by(anio=anio, periodo=TipoCuatrimestre.PRIMERO).first()
        if not cuatri:
            cuatri = Cuatrimestre(anio=anio, periodo=TipoCuatrimestre.PRIMERO)
            db.add(cuatri)
            db.commit()

        # Recorrer profesores
        for profe in profesores:
            nombres_materias = materias_asignadas.get(profe.id, [])
            
            for nombre_mat in nombres_materias:
                materia = db.query(Materia).filter_by(nombre=nombre_mat).first()
                if not materia: continue # Si la materia no existe en la BD, saltar

                # 1. Crear Cursada Histórica
                cursada = db.query(Cursada).filter_by(
                    materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id
                ).first()

                if not cursada:
                    cursada = Cursada(materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id)
                    db.add(cursada)
                    db.commit()
                    db.refresh(cursada)

                    # Inscribir alumnos aleatorios (entre 5 y 15)
                    random.shuffle(alumnos)
                    for alumno in alumnos[:random.randint(5, 15)]:
                        db.add(Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=True))
                
                # 2. Encuesta de Alumnos (Cerrada)
                instancia_encuesta = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
                if not instancia_encuesta:
                    instancia_encuesta = EncuestaInstancia(
                        cursada_id=cursada.id,
                        plantilla_id=plantilla_encuesta.id,
                        fecha_inicio=datetime(anio, 4, 1),
                        fecha_fin=datetime(anio, 7, 1),
                        estado=EstadoInstancia.CERRADA
                    )
                    db.add(instancia_encuesta)
                    db.commit()
                
                # 3. Informe del Profesor (EL OBJETIVO PRINCIPAL)
                existe_informe = db.query(ActividadCurricularInstancia).filter_by(cursada_id=cursada.id).first()
                
                if not existe_informe:
                    # Crear Informe en estado COMPLETADO
                    informe = ActividadCurricularInstancia(
                        actividad_curricular_id=plantilla_informe.id,
                        cursada_id=cursada.id,
                        encuesta_instancia_id=instancia_encuesta.id,
                        profesor_id=profe.id,
                        estado=EstadoInforme.COMPLETADO, # ¡Importante!
                        tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
                        fecha_inicio=datetime(anio, 7, 5),
                        fecha_fin=datetime(anio, 7, 20)
                    )
                    db.add(informe)
                    db.commit()
                    db.refresh(informe)

                    # --- GENERACIÓN DE RESPUESTAS SMART ---
                    
                    # Crear el contenedor de respuestas (Set)
                    rset = RespuestaSet(instrumento_instancia_id=informe.id, created_at=informe.fecha_fin)
                    db.add(rset)
                    db.commit() # Necesitamos el ID del set

                    # Recorrer preguntas de la plantilla
                    for seccion in plantilla_informe.secciones:
                        for pregunta in seccion.preguntas:
                            
                            # A. Respuestas de Texto (Redacción)
                            if pregunta.tipo == TipoPregunta.REDACCION:
                                # Usamos la función smart para elegir texto coherente
                                texto_respuesta = obtener_respuesta_smart(pregunta.texto)
                                
                                # Si es una pregunta de "Cantidad", poner un número
                                if "cantidad" in pregunta.texto.lower():
                                    texto_respuesta = str(random.randint(10, 40))
                                
                                db.add(RespuestaRedaccion(
                                    pregunta_id=pregunta.id,
                                    respuesta_set_id=rset.id,
                                    tipo=TipoPregunta.REDACCION,
                                    texto=texto_respuesta
                                ))

                            # B. Respuestas Multiple Choice
                            elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE and pregunta.opciones:
                                # Elegir una opción al azar
                                opcion_elegida = random.choice(pregunta.opciones)
                                db.add(RespuestaMultipleChoice(
                                    pregunta_id=pregunta.id,
                                    respuesta_set_id=rset.id,
                                    tipo=TipoPregunta.MULTIPLE_CHOICE,
                                    opcion_id=opcion_elegida.id
                                ))
                    
                    informes_creados += 1
                    
        db.commit()

    print(f"✅ ¡Hecho! Se generaron {informes_creados} informes históricos con respuestas realistas.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_history(db)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()