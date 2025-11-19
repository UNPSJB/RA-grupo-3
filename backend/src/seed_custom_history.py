import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# --- Configuración de Path para importar módulos de src ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

try:
    from src.database import SessionLocal
    from src.models import ModeloBase
    from src.enumerados import (
        TipoCuatrimestre, EstadoInstancia, TipoInstrumento, 
        TipoPregunta, EstadoInstrumento
    )
    from src.materia.models import Materia, Cuatrimestre, Cursada
    from src.persona.models import Profesor, Alumno, Inscripcion
    from src.encuestas.models import EncuestaInstancia, Encuesta
    
    # --- CORRECCIÓN: Importar Seccion explícitamente ---
    from src.seccion.models import Seccion 
    from src.pregunta.models import PreguntaMultipleChoice
    from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion

except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

# --- Configuración del Escenario ---
USERNAME_ALUMNO = "alumno1"  
USERNAME_PROFESOR = "profesor1" 

def get_or_create_materia(db: Session, nombre: str):
    materia = db.query(Materia).filter_by(nombre=nombre).first()
    if not materia:
        materia = Materia(nombre=nombre, descripcion=f"Materia histórica {nombre}")
        db.add(materia)
        db.commit()
        db.refresh(materia)
    return materia

def generar_respuestas_para_instancia(db: Session, instancia: EncuestaInstancia):
    """Genera respuestas aleatorias para una instancia de encuesta dada."""
    
    # Cargar la plantilla con sus preguntas
    # --- CORRECCIÓN: Usar las clases importadas directamente, sin 'models.' ---
    plantilla = db.query(Encuesta).options(
        selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).filter_by(id=instancia.plantilla_id).first()

    if not plantilla:
        return

    # Crear el Set de respuestas
    rset = RespuestaSet(instrumento_instancia_id=instancia.id)
    db.add(rset)
    db.flush() # Para tener ID

    preguntas = []
    for seccion in plantilla.secciones:
        preguntas.extend(seccion.preguntas)

    for preg in preguntas:
        if preg.tipo == TipoPregunta.MULTIPLE_CHOICE:
            # Castear a PreguntaMultipleChoice para acceder a opciones
            preg_mc = db.get(PreguntaMultipleChoice, preg.id)
            if preg_mc and preg_mc.opciones:
                opcion = random.choice(preg_mc.opciones)
                resp = RespuestaMultipleChoice(
                    pregunta_id=preg.id,
                    respuesta_set_id=rset.id,
                    tipo=TipoPregunta.MULTIPLE_CHOICE,
                    opcion_id=opcion.id
                )
                db.add(resp)
        
        elif preg.tipo == TipoPregunta.REDACCION:
            # Responder solo a veces para dar variedad
            if random.random() > 0.5:
                resp = RespuestaRedaccion(
                    pregunta_id=preg.id,
                    respuesta_set_id=rset.id,
                    tipo=TipoPregunta.REDACCION,
                    texto="Respuesta simulada por script de historial."
                )
                db.add(resp)

def seed_custom_history(db: Session):
    print(f"🚀 Iniciando carga de historial a medida para '{USERNAME_ALUMNO}'...")

    # 1. Buscar Alumno y Profesor
    alumno = db.query(Alumno).filter_by(username=USERNAME_ALUMNO).first()
    profesor = db.query(Profesor).filter_by(username=USERNAME_PROFESOR).first()
    
    # 2. Buscar una plantilla publicada
    plantilla = db.query(Encuesta).filter(
        Encuesta.tipo == TipoInstrumento.ENCUESTA,
        Encuesta.estado == EstadoInstrumento.PUBLICADA
    ).first()

    if not alumno or not profesor or not plantilla:
        print("❌ Error: Faltan datos base (Alumno, Profesor o Plantilla). Ejecuta seed_data.py primero.")
        return

    # ==============================================================================
    # AÑO 2023
    # ==============================================================================
    print("\n📅 Procesando Año 2023 (Objetivo: Dejar 2 encuestas sin responder)...")
    
    anio = 2023
    cuatri_23 = db.query(Cuatrimestre).filter_by(anio=anio, periodo=TipoCuatrimestre.ANUAL).first()
    if not cuatri_23:
        cuatri_23 = Cuatrimestre(anio=anio, periodo=TipoCuatrimestre.ANUAL)
        db.add(cuatri_23)
        db.commit()

    materias_2023 = [
        ("Matemática I (2023)", True),   # True = Respondida
        ("Física I (2023)", True),
        ("Inglés I (2023)", True),
        ("Química General (2023)", False), # False = NO Respondida
        ("Introducción a la Ing. (2023)", False)
    ]

    for nombre_mat, responder in materias_2023:
        mat = get_or_create_materia(db, nombre_mat)
        
        # Crear Cursada
        cursada = Cursada(materia_id=mat.id, cuatrimestre_id=cuatri_23.id, profesor_id=profesor.id)
        db.add(cursada)
        db.commit()
        db.refresh(cursada)

        # Inscribir Alumno
        inscripcion = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=responder)
        db.add(inscripcion)

        # Crear Instancia de Encuesta CERRADA
        instancia = EncuestaInstancia(
            cursada_id=cursada.id,
            plantilla_id=plantilla.id,
            fecha_inicio=datetime(anio, 3, 1),
            fecha_fin=datetime(anio, 12, 15),
            estado=EstadoInstancia.CERRADA
        )
        db.add(instancia)
        db.commit()
        db.refresh(instancia)

        if responder:
            generar_respuestas_para_instancia(db, instancia)
            print(f"   ✅ {nombre_mat}: Encuesta Creada y RESPONDIDA.")
        else:
            print(f"   ⚠️ {nombre_mat}: Encuesta Creada (SIN RESPONDER).")

    # ==============================================================================
    # AÑO 2024
    # ==============================================================================
    print("\n📅 Procesando Año 2024 (Objetivo: 4/7 completadas)...")
    
    anio = 2024
    cuatri_24 = db.query(Cuatrimestre).filter_by(anio=anio, periodo=TipoCuatrimestre.ANUAL).first()
    if not cuatri_24:
        cuatri_24 = Cuatrimestre(anio=anio, periodo=TipoCuatrimestre.ANUAL)
        db.add(cuatri_24)
        db.commit()

    materias_2024 = [
        ("Programación Orientada a Objetos", True),
        ("Estructura de Datos", True),
        ("Arquitectura de Computadoras", True),
        ("Sistemas Operativos I", True),
        ("Estadística (2024)", False),      # No
        ("Análisis de Sistemas", False),    # No
        ("Base de Datos II", False)         # No
    ]

    for nombre_mat, responder in materias_2024:
        mat = get_or_create_materia(db, nombre_mat)
        
        # Crear Cursada
        cursada = Cursada(materia_id=mat.id, cuatrimestre_id=cuatri_24.id, profesor_id=profesor.id)
        db.add(cursada)
        db.commit()
        db.refresh(cursada)

        # Inscribir Alumno
        inscripcion = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id, ha_respondido=responder)
        db.add(inscripcion)

        # Crear Instancia CERRADA
        instancia = EncuestaInstancia(
            cursada_id=cursada.id,
            plantilla_id=plantilla.id,
            fecha_inicio=datetime(anio, 3, 1),
            fecha_fin=datetime(anio, 12, 15),
            estado=EstadoInstancia.CERRADA
        )
        db.add(instancia)
        db.commit()
        db.refresh(instancia)

        if responder:
            generar_respuestas_para_instancia(db, instancia)
            print(f"   ✅ {nombre_mat}: Encuesta Creada y RESPONDIDA.")
        else:
            print(f"   ⚠️ {nombre_mat}: Encuesta Creada (SIN RESPONDER).")

    db.commit()
    print("\n✨ Carga de historial finalizada con éxito.")

# --- Ejecución ---
if __name__ == "__main__":
    from src import models # Asegura que los modelos estén cargados en el registro
    db = SessionLocal()
    try:
        seed_custom_history(db)
    except Exception as e:
        print(f"❌ Error crítico: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()