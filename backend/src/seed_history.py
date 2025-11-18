import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session

# --- Configuración de Path para importar módulos de src ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# --------------------------------------------------------

from src.database import SessionLocal
from src.enumerados import TipoCuatrimestre, EstadoInstancia, TipoInstrumento, EstadoInstrumento, TipoPregunta, EstadoInforme
from src.materia.models import Materia, Cuatrimestre, Cursada
from src.persona.models import Profesor, Alumno, Inscripcion
from src.encuestas.models import EncuestaInstancia, Encuesta

# --- AGREGAR ESTOS IMPORTS ---
# Importamos Pregunta y Seccion para que se registren en el ORM
from src.pregunta.models import Pregunta, Opcion  
from src.seccion.models import Seccion
# -----------------------------

from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular

def seed_history(db: Session):
    print("📜 Iniciando generación de historial académico (2022-2024)...")

    # 1. Verificar datos base
    profesores = db.query(Profesor).all()
    alumnos = db.query(Alumno).all()
    plantilla_encuesta = db.query(Encuesta).filter(Encuesta.estado == EstadoInstrumento.PUBLICADA).first()
    plantilla_informe = db.query(ActividadCurricular).filter(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR).first()

    if not profesores or not alumnos or not plantilla_encuesta:
        print("❌ Error: Faltan datos base. Por favor, ejecuta 'seed_data.py' primero.")
        return

    # Mapa de materias por profesor (debe coincidir con seed_data.py)
    materias_map = {
        "profesor1": ["Álgebra Lineal", "Programación I"],
        "profesor2": ["Sistemas Operativos"],
        "profesor3": ["Estabilidad I"]
    }

    anios = [2022, 2023, 2024]
    total_cursadas = 0

    for anio in anios:
        print(f"   📅 Procesando Año {anio}...")
        
        # A. Crear/Buscar Cuatrimestre Histórico
        cuatri = db.query(Cuatrimestre).filter_by(anio=anio, periodo=TipoCuatrimestre.PRIMERO).first()
        if not cuatri:
            cuatri = Cuatrimestre(anio=anio, periodo=TipoCuatrimestre.PRIMERO)
            db.add(cuatri)
            db.commit()
        
        # B. Crear Cursadas para este año
        for profe in profesores:
            # Obtenemos las materias que da este profesor
            nombres_materias = materias_map.get(profe.username, [])
            
            for nombre_mat in nombres_materias:
                materia = db.query(Materia).filter_by(nombre=nombre_mat).first()
                if not materia: continue

                # 1. Crear Cursada
                cursada = db.query(Cursada).filter_by(
                    materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profe.id
                ).first()
                
                if not cursada:
                    cursada = Cursada(
                        materia_id=materia.id,
                        cuatrimestre_id=cuatri.id,
                        profesor_id=profe.id
                    )
                    db.add(cursada)
                    db.commit()
                    db.refresh(cursada)
                    total_cursadas += 1

                # 2. Inscribir a todos los alumnos
                for alumno in alumnos:
                    inscripcion = db.query(Inscripcion).filter_by(
                        alumno_id=alumno.id, cursada_id=cursada.id
                    ).first()
                    if not inscripcion:
                         db.add(Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=True))
                
                # 3. Crear la Encuesta CERRADA
                instancia = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
                
                if not instancia:
                    fecha_cierre = datetime(anio, 7, 15, 18, 0, 0)
                    instancia = EncuestaInstancia(
                        cursada_id=cursada.id,
                        plantilla_id=plantilla_encuesta.id,
                        fecha_inicio=datetime(anio, 3, 1),
                        fecha_fin=fecha_cierre,
                        estado=EstadoInstancia.CERRADA
                    )
                    db.add(instancia)
                    db.commit()
                    db.refresh(instancia)

                    # 4. Simular Respuestas de Alumnos (Solo si creamos la instancia, para no duplicar)
                    preguntas = []
                    for s in plantilla_encuesta.secciones: 
                        preguntas.extend(s.preguntas)

                    for alumno in alumnos:
                        r_set = RespuestaSet(instrumento_instancia_id=instancia.id)
                        
                        for preg in preguntas:
                            if preg.tipo == TipoPregunta.MULTIPLE_CHOICE:
                                if not preg.opciones: continue
                                opcion = random.choice(preg.opciones)
                                
                                db.add(RespuestaMultipleChoice(
                                    pregunta_id=preg.id,
                                    opcion_id=opcion.id,
                                    tipo=TipoPregunta.MULTIPLE_CHOICE,
                                    respuesta_set=r_set
                                ))
                            elif preg.tipo == TipoPregunta.REDACCION:
                                 db.add(RespuestaRedaccion(
                                    pregunta_id=preg.id,
                                    texto=f"Opinión del alumno sobre la cursada de {anio}.",
                                    tipo=TipoPregunta.REDACCION,
                                    respuesta_set=r_set
                                ))
                        db.add(r_set)
                
                # 5. Generar Informe de Cátedra
                if plantilla_informe:
                     existe_informe = db.query(ActividadCurricularInstancia).filter_by(cursada_id=cursada.id).first()
                     if not existe_informe:
                        informe = ActividadCurricularInstancia(
                            actividad_curricular_id=plantilla_informe.id,
                            cursada_id=cursada.id,
                            encuesta_instancia_id=instancia.id,
                            profesor_id=profe.id,
                            estado=EstadoInforme.COMPLETADO, 
                            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR
                        )
                        db.add(informe)
        
        db.commit()

    print(f"✅ Historial generado exitosamente: {total_cursadas} cursadas históricas procesadas.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_history(db)
    except Exception as e:
        print(f"❌ Error crítico: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()