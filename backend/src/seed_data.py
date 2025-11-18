# backend/src/seed_data.py
import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
# -----------------------------

from src.database import SessionLocal, engine
from src.models import ModeloBase
from src.auth.services import get_password_hash
from src.enumerados import TipoCuatrimestre, EstadoInstancia, TipoInstrumento, EstadoInstrumento

# Imports de Modelos
from src.materia.models import Materia, Cuatrimestre, Cursada, Sede, Departamento, Carrera
from src.persona.models import Profesor, Alumno, Inscripcion, AdminDepartamento, AdminSecretaria
from src.encuestas.models import EncuestaInstancia, Encuesta

def seed_initial_data(db: Session):
    print("🌱 Iniciando carga de datos de prueba (v3 - Estadísticas)...")

    # --- 1. Sedes, Deptos y Carreras ---
    print("   > Configurando Estructura Académica...")
    sede = db.scalar(select(Sede).filter_by(localidad="Comodoro Rivadavia"))
    if not sede:
        sede = Sede(localidad="Comodoro Rivadavia")
        db.add(sede)
        db.commit()

    depto_info = db.scalar(select(Departamento).filter_by(nombre="Departamento de Ingeniería Informática"))
    if not depto_info:
        depto_info = Departamento(nombre="Departamento de Ingeniería Informática", sede_id=sede.id)
        db.add(depto_info)
        db.commit()

    carrera = db.scalar(select(Carrera).filter_by(nombre="Ingeniería en Informática"))
    if not carrera:
        carrera = Carrera(nombre="Ingeniería en Informática", departamento_id=depto_info.id)
        db.add(carrera)
        db.commit()
    
    db.refresh(carrera)

    # --- 2. Cuatrimestre ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        cuatri = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit()
        print("     + Cuatrimestre 1C 2025 creado.")

    # --- 3. Usuarios (3 Profes, 5 Alumnos, 2 Admins) ---
    print("   > Creando Usuarios...")
    
    # Profesores
    profesores = []
    for i in range(1, 4):
        username = f"profesor{i}"
        p = db.query(Profesor).filter_by(username=username).first()
        if not p:
            p = Profesor(
                nombre=f"Profesor {i} Apellido",
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(p)
            print(f"     + Creado: {username}")
        profesores.append(p)
    
    # Alumnos
    alumnos = []
    for i in range(1, 6):
        username = f"alumno{i}"
        a = db.query(Alumno).filter_by(username=username).first()
        if not a:
            a = Alumno(
                nombre=f"Alumno {i} Test",
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(a)
        alumnos.append(a)
    
    # Admin Departamento
    if not db.query(AdminDepartamento).filter_by(username="admin_dpto").first():
        ad = AdminDepartamento(
            nombre="Jefe Departamento Info",
            username="admin_dpto",
            hashed_password=get_password_hash("123456"),
            departamento_id=depto_info.id
        )
        db.add(ad)
        print("     + Creado: admin_dpto")

    # Admin Secretaria
    if not db.query(AdminSecretaria).filter_by(username="admin_sec").first():
        sec = AdminSecretaria(
            nombre="Secretaria Académica",
            username="admin_sec",
            hashed_password=get_password_hash("123456")
        )
        db.add(sec)
        print("     + Creado: admin_sec")

    db.commit()
    # Recargar objetos para tener IDs
    for p in profesores: db.refresh(p)
    for a in alumnos: db.refresh(a)


    # --- 4. Materias y Cursadas ---
    print("   > Configurando Materias y Cursadas...")
    
    # Definición de asignaciones (Materia -> Profesor Index)
    # Prof 0 (profesor1) tiene 2 materias. Prof 1 y 2 tienen 1 materia.
    config_cursadas = [
        {"nombre": "Álgebra Lineal", "profesor_idx": 0},
        {"nombre": "Programación I", "profesor_idx": 0},
        {"nombre": "Sistemas Operativos", "profesor_idx": 1},
        {"nombre": "Estabilidad I", "profesor_idx": 2},
    ]

    cursadas_creadas = []

    for item in config_cursadas:
        # Crear/Buscar Materia
        materia = db.query(Materia).filter_by(nombre=item["nombre"]).first()
        if not materia:
            materia = Materia(nombre=item["nombre"], descripcion="Materia obligatoria")
            db.add(materia)
            db.commit()
            db.refresh(materia)
            # Vincular a carrera si no lo está
            if materia not in carrera.materias:
                carrera.materias.append(materia)
                db.add(carrera)
                db.commit()
        
        # Crear/Buscar Cursada
        profesor = profesores[item["profesor_idx"]]
        cursada = db.query(Cursada).filter_by(
            materia_id=materia.id, cuatrimestre_id=cuatri.id
        ).first()
        
        if not cursada:
            cursada = Cursada(
                materia_id=materia.id,
                cuatrimestre_id=cuatri.id,
                profesor_id=profesor.id
            )
            db.add(cursada)
            db.commit()
            print(f"     + Cursada creada: {materia.nombre} (Prof: {profesor.username})")
        
        db.refresh(cursada)
        cursadas_creadas.append(cursada)

    # --- 5. Inscripciones ---
    print("   > Inscribiendo alumnos...")
    for cursada in cursadas_creadas:
        for alumno in alumnos:
            inscripcion = db.query(Inscripcion).filter_by(
                alumno_id=alumno.id, cursada_id=cursada.id
            ).first()
            if not inscripcion:
                ins = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id)
                db.add(ins)
    db.commit()

    # --- 6. Instancias de Encuesta (Preparación para Respuestas) ---
    print("   > Generando instancias de encuestas...")
    
    # Buscamos una plantilla publicada (del seed_plantilla.py)
    plantilla = db.query(Encuesta).filter(
        Encuesta.estado == EstadoInstrumento.PUBLICADA
    ).first()

    if not plantilla:
        print("     ! ADVERTENCIA: No se encontró ninguna plantilla de encuesta PUBLICADA.")
        print("     ! Ejecuta 'python -m src.seed_plantilla' primero.")
        return

    for cursada in cursadas_creadas:
        instancia = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
        if not instancia:
            # Creamos la instancia ACTIVA (el otro script la responderá y cerrará)
            nueva_instancia = EncuestaInstancia(
                cursada_id=cursada.id,
                plantilla_id=plantilla.id,
                fecha_inicio=datetime.now(),
                estado=EstadoInstancia.ACTIVA
            )
            db.add(nueva_instancia)
            print(f"     + Encuesta activada para cursada ID {cursada.id}")
    
    db.commit()
    print("✅ Carga de estructura y usuarios finalizada.")


def create_tables():
    from src.models import ModeloBase
    # Importar todos los modelos para que SQLAlchemy los registre
    from src.materia import models
    from src.persona import models
    from src.encuestas import models
    from src.seccion import models
    from src.pregunta import models
    from src.respuesta import models
    from src.instrumento import models
    
    ModeloBase.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()