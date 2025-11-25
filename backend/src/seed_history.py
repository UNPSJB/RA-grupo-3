import sys
import os
import random
from datetime import datetime, timedelta

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from sqlalchemy.orm import selectinload
from src.database import SessionLocal
from src.enumerados import TipoCuatrimestre, EstadoInstancia, TipoInstrumento, EstadoInstrumento, TipoPregunta, EstadoInforme
from src.materia.models import Materia, Cuatrimestre, Cursada
from src.persona.models import Profesor, Alumno, Inscripcion
from src.encuestas.models import EncuestaInstancia, Encuesta
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular
from src.seccion.models import Seccion
from src.pregunta.models import PreguntaMultipleChoice
from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion

# --- BANCO DE DATOS "REALISTAS" ---
FRASES_ACADEMICAS = [
    "El nivel académico del grupo fue heterogéneo, con dificultades en conceptos base.",
    "Se cumplió con el cronograma previsto. Alumnos muy participativos.",
    "Rendimiento superior al promedio histórico.",
    "Fue necesario reforzar temas de la unidad 2.",
    "Excelente grupo humano, muy proactivo.",
]

FRASES_INFRAESTRUCTURA = [
    "El proyector del aula funcionó intermitentemente.",
    "Las computadoras del laboratorio necesitan actualización.",
    "Aula cómoda y adecuada para la cantidad de alumnos.",
    "Problemas de conectividad WiFi en el pabellón.",
]

FRASES_CORTAS = [
    "Sin observaciones.",
    "Desarrollo normal.",
    "Todo correcto.",
    "Acorde a lo planificado."
]

def obtener_respuesta_smart(texto_pregunta: str) -> str:
    """Selecciona una respuesta coherente."""
    texto = texto_pregunta.lower()
    if "infraestructura" in texto or "equipamiento" in texto:
        return random.choice(FRASES_INFRAESTRUCTURA)
    if "alumno" in texto or "rendimiento" in texto:
        return random.choice(FRASES_ACADEMICAS)
    return random.choice(FRASES_CORTAS)

def seed_history(db):
    print("\n🌱 Generando Historial 'Smart' con Porcentajes (2022-2024)...")

    profesores = db.query(Profesor).all()
    alumnos = db.query(Alumno).all()
    
    plantilla_encuesta = db.query(Encuesta).options(
        selectinload(Encuesta.secciones).selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)).selectinload(PreguntaMultipleChoice.opciones)
    ).filter(Encuesta.estado == EstadoInstrumento.PUBLICADA).first()

    plantilla_informe = db.query(ActividadCurricular).options(
        selectinload(ActividadCurricular.secciones).selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)).selectinload(PreguntaMultipleChoice.opciones)
    ).filter(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR).first()

    if not profesores or not plantilla_informe:
        print("❌ Faltan datos base. Corre seed_data.py primero.")
        return

    # Asignación fija de materias para consistencia
    materias_asignadas = {
        profesores[0].id: ["Programación I", "Bases de Datos I"],
        profesores[1].id: ["Álgebra Lineal"] if len(profesores) > 1 else [],
        profesores[2].id: ["Sistemas Operativos"] if len(profesores) > 2 else []
    }

    anios = [2022, 2023, 2024]
    informes_creados = 0

    for anio in anios:
        print(f"   📅 Año {anio}...")
        cuatri = db.query(Cuatrimestre).filter_by(anio=anio, periodo=TipoCuatrimestre.PRIMERO).first()
        if not cuatri:
            cuatri = Cuatrimestre(anio=anio, periodo=TipoCuatrimestre.PRIMERO)
            db.add(cuatri)
            db.commit()

        for profe in profesores:
            nombres_materias = materias_asignadas.get(profe.id, [])
            
            for nombre_mat in nombres_materias:
                materia = db.query(Materia).filter_by(nombre=nombre_mat).first()
                if not materia: continue

                # 1. Cursada
                cursada = db.query(Cursada).filter_by(
                    materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id
                ).first()

                if not cursada:
                    cursada = Cursada(materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id)
                    db.add(cursada)
                    db.commit()
                    db.refresh(cursada)
                    # Inscribir alumnos dummy
                    for alumno in alumnos[:10]:
                         db.add(Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=True))

                # 2. Encuesta (Cerrada)
                instancia_encuesta = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
                if not instancia_encuesta:
                    instancia_encuesta = EncuestaInstancia(
                        cursada_id=cursada.id, plantilla_id=plantilla_encuesta.id,
                        fecha_inicio=datetime(anio, 4, 1), fecha_fin=datetime(anio, 7, 1),
                        estado=EstadoInstancia.CERRADA
                    )
                    db.add(instancia_encuesta)
                    db.commit()

                # 3. Informe Profesor
                existe_informe = db.query(ActividadCurricularInstancia).filter_by(cursada_id=cursada.id).first()
                if not existe_informe:
                    informe = ActividadCurricularInstancia(
                        actividad_curricular_id=plantilla_informe.id,
                        cursada_id=cursada.id, encuesta_instancia_id=instancia_encuesta.id,
                        profesor_id=profe.id, estado=EstadoInforme.COMPLETADO,
                        tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
                        fecha_inicio=datetime(anio, 7, 5), fecha_fin=datetime(anio, 7, 20)
                    )
                    db.add(informe)
                    db.commit()
                    db.refresh(informe)

                    # --- RESPUESTAS ---
                    rset = RespuestaSet(instrumento_instancia_id=informe.id, created_at=informe.fecha_fin)
                    db.add(rset)
                    db.commit()

                    for seccion in plantilla_informe.secciones:
                        for pregunta in seccion.preguntas:
                            if pregunta.tipo == TipoPregunta.REDACCION:
                                texto_pregunta = pregunta.texto
                                texto_respuesta = ""

                                # --- AQUÍ ESTÁ LA MAGIA PARA LOS PORCENTAJES ---
                                if "Porcentaje" in texto_pregunta:
                                    # Formato: "VALOR ||| JUSTIFICACIÓN"
                                    valor = f"{random.choice([75, 80, 85, 90, 95, 100])}%"
                                    justif = obtener_respuesta_smart("rendimiento")
                                    texto_respuesta = f"{valor} ||| {justif}"
                                
                                elif texto_pregunta.startswith("4."): # Desempeño auxiliares
                                    valor = random.choice(["Excelente (E)", "Muy Bueno (MB)"])
                                    justif = "Gran compromiso con la cátedra."
                                    texto_respuesta = f"{valor} ||| {justif}"
                                
                                elif "cantidad" in texto_pregunta.lower():
                                     texto_respuesta = str(random.randint(15, 40))
                                     
                                else:
                                    texto_respuesta = obtener_respuesta_smart(texto_pregunta)

                                db.add(RespuestaRedaccion(
                                    pregunta_id=pregunta.id, respuesta_set_id=rset.id,
                                    tipo=TipoPregunta.REDACCION, texto=texto_respuesta
                                ))

                            elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE and pregunta.opciones:
                                db.add(RespuestaMultipleChoice(
                                    pregunta_id=pregunta.id, respuesta_set_id=rset.id,
                                    tipo=TipoPregunta.MULTIPLE_CHOICE,
                                    opcion_id=random.choice(pregunta.opciones).id
                                ))
                    
                    informes_creados += 1
        db.commit()

    print(f"✅ {informes_creados} informes históricos generados correctamente.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_history(db)
    finally:
        db.close()