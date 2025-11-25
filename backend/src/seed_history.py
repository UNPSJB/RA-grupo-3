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
from sqlalchemy import select
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
    "El nivel académico fue heterogéneo, se reforzaron conceptos base.",
    "Grupo muy participativo, se cumplió el cronograma.",
    "Rendimiento superior al promedio histórico.",
    "Dificultades en la unidad 3, se agregaron clases de consulta.",
    "Excelente grupo humano, muy proactivo.",
]

FRASES_INFRAESTRUCTURA = [
    "El proyector funcionó intermitentemente.",
    "Faltan licencias de software en el laboratorio.",
    "Aula cómoda y adecuada.",
    "Problemas de WiFi en el pabellón.",
]

def obtener_respuesta_smart(texto_pregunta: str) -> str:
    """Selecciona una respuesta coherente según el tema."""
    texto = texto_pregunta.lower()
    if "infraestructura" in texto or "equipamiento" in texto:
        return random.choice(FRASES_INFRAESTRUCTURA)
    if "alumno" in texto or "rendimiento" in texto:
        return random.choice(FRASES_ACADEMICAS)
    return "Sin observaciones particulares."

def seed_history(db):
    print("\n🌱 Reparando/Generando Historial (2022-2024)...")

    profesores = db.query(Profesor).all()
    alumnos = db.query(Alumno).all()
    
    plantilla_encuesta = db.query(Encuesta).options(
        selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).filter(Encuesta.estado == EstadoInstrumento.PUBLICADA).first()

    plantilla_informe = db.query(ActividadCurricular).options(
        selectinload(ActividadCurricular.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).filter(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR).first()

    if not profesores or not plantilla_informe or not plantilla_encuesta:
        print("❌ Faltan datos base. Corre seed_data.py y seed_plantilla.py primero.")
        return

    materias_asignadas = {
        profesores[0].id: ["Programación I", "Bases de Datos I"],
        profesores[1].id: ["Álgebra Lineal"] if len(profesores) > 1 else [],
        profesores[2].id: ["Sistemas Operativos"] if len(profesores) > 2 else []
    }

    anios = [2022, 2023, 2024]
    encuestas_reparadas = 0

    for anio in anios:
        print(f"   📅 Procesando Año {anio}...")
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

                # 1. Asegurar Cursada
                cursada = db.query(Cursada).filter_by(
                    materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id
                ).first()

                if not cursada:
                    cursada = Cursada(materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id)
                    db.add(cursada)
                    db.commit()
                    db.refresh(cursada)
                    # Inscribir alumnos
                    for alumno in alumnos[:15]: 
                         if not db.query(Inscripcion).filter_by(alumno_id=alumno.id, cursada_id=cursada.id).first():
                            db.add(Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=True))
                    db.commit()

                # 2. Asegurar Encuesta (Cerrada)
                instancia_encuesta = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
                if not instancia_encuesta:
                    instancia_encuesta = EncuestaInstancia(
                        cursada_id=cursada.id, plantilla_id=plantilla_encuesta.id,
                        fecha_inicio=datetime(anio, 4, 1), fecha_fin=datetime(anio, 7, 1),
                        estado=EstadoInstancia.CERRADA
                    )
                    db.add(instancia_encuesta)
                    db.commit()
                    db.refresh(instancia_encuesta)

                # --- REPARACIÓN DE RESPUESTAS ---
                # Verificamos si tiene respuestas. Si tiene 0, las generamos.
                cant_respuestas = db.query(RespuestaSet).filter_by(instrumento_instancia_id=instancia_encuesta.id).count()
                
                if cant_respuestas == 0:
                    print(f"      🔧 Inyectando respuestas para {materia.nombre} ({anio})...")
                    cantidad_a_generar = random.randint(10, 15)
                    preguntas_encuesta = [p for s in plantilla_encuesta.secciones for p in s.preguntas]
                    
                    for _ in range(cantidad_a_generar):
                        rset_alumno = RespuestaSet(instrumento_instancia_id=instancia_encuesta.id, created_at=datetime(anio, 6, random.randint(1, 28)))
                        db.add(rset_alumno)
                        db.flush() 
                        
                        for preg in preguntas_encuesta:
                            if preg.tipo == TipoPregunta.MULTIPLE_CHOICE and preg.opciones:
                                # Tendencia positiva
                                opcion = random.choice(preg.opciones)
                                db.add(RespuestaMultipleChoice(
                                    pregunta_id=preg.id,
                                    respuesta_set_id=rset_alumno.id,
                                    tipo=TipoPregunta.MULTIPLE_CHOICE,
                                    opcion_id=opcion.id
                                ))
                    encuestas_reparadas += 1
                    db.commit()

                # 3. Asegurar Informe Profesor
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

                    # Respuestas del profe
                    rset_profe = RespuestaSet(instrumento_instancia_id=informe.id, created_at=informe.fecha_fin)
                    db.add(rset_profe)
                    db.flush()

                    for seccion in plantilla_informe.secciones:
                        for pregunta in seccion.preguntas:
                            if pregunta.tipo == TipoPregunta.REDACCION:
                                texto_resp = ""
                                if "Porcentaje" in pregunta.texto:
                                    texto_resp = f"{random.choice([80, 85, 90, 95, 100])}% ||| {obtener_respuesta_smart('rendimiento')}"
                                elif pregunta.texto.startswith("4."):
                                    texto_resp = f"Muy Bueno (MB) ||| Compromiso alto."
                                elif "cantidad" in pregunta.texto.lower():
                                    texto_resp = str(random.randint(20, 40))
                                else:
                                    texto_resp = obtener_respuesta_smart(pregunta.texto)
                                
                                db.add(RespuestaRedaccion(pregunta_id=pregunta.id, respuesta_set_id=rset_profe.id, tipo=TipoPregunta.REDACCION, texto=texto_resp))
                            
                            elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE and pregunta.opciones:
                                db.add(RespuestaMultipleChoice(pregunta_id=pregunta.id, respuesta_set_id=rset_profe.id, tipo=TipoPregunta.MULTIPLE_CHOICE, opcion_id=random.choice(pregunta.opciones).id))
                    
                    db.commit()

    print(f"✅ Finalizado. Se repararon/llenaron {encuestas_reparadas} encuestas con datos de alumnos.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_history(db)
    finally:
        db.close()