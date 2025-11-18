from sqlalchemy.orm import Session
from sqlalchemy import select
from src.database import SessionLocal, engine
from datetime import datetime, timedelta
# Imports de Modelos
from src.materia.models import (
    Materia, 
    Cuatrimestre, 
    Cursada, 
    Sede,           
    Departamento,   
    Carrera         
)
from src.persona.models import Profesor, Alumno, Inscripcion, AdminDepartamento, AdminSecretaria
from src.encuestas.models import EncuestaInstancia, Encuesta
from src.enumerados import TipoCuatrimestre, EstadoInstancia, EstadoInstrumento
from src.auth.services import get_password_hash

def seed_initial_data(db: Session):
    print("🌱 Iniciando carga de datos de prueba (v4 - Multisede y +Alumnos)...")

    # --- 1. Sedes ---
    print("   > Configurando Sedes...")
    sede_cr = db.scalars(select(Sede).filter_by(localidad="Comodoro Rivadavia")).first()
    if not sede_cr:
        sede_cr = Sede(localidad="Comodoro Rivadavia")
        db.add(sede_cr)
    
    sede_tw = db.scalars(select(Sede).filter_by(localidad="Trelew")).first()
    if not sede_tw:
        sede_tw = Sede(localidad="Trelew")
        db.add(sede_tw)
    
    db.commit()
    db.refresh(sede_cr)
    db.refresh(sede_tw)

    # --- 2. Departamentos (Uno en CR, Uno en TW) ---
    print("   > Configurando Departamentos...")
    
    # Comodoro
    depto_info_cr = db.scalars(select(Departamento).filter_by(nombre="Depto. Informática (CR)")).first()
    if not depto_info_cr:
        depto_info_cr = Departamento(nombre="Depto. Informática (CR)", sede_id=sede_cr.id)
        db.add(depto_info_cr)

    # Trelew (Nuevo para el profesor viajero)
    depto_info_tw = db.scalars(select(Departamento).filter_by(nombre="Depto. Informática (TW)")).first()
    if not depto_info_tw:
        depto_info_tw = Departamento(nombre="Depto. Informática (TW)", sede_id=sede_tw.id)
        db.add(depto_info_tw)
    
    db.commit()
    db.refresh(depto_info_cr)
    db.refresh(depto_info_tw)

    # --- 3. Carreras ---
    print("   > Configurando Carreras...")
    carrera_cr = db.scalars(select(Carrera).filter_by(nombre="Ingeniería en Informática")).first()
    if not carrera_cr:
        carrera_cr = Carrera(nombre="Ingeniería en Informática", departamento_id=depto_info_cr.id)
        db.add(carrera_cr)

    carrera_tw = db.scalars(select(Carrera).filter_by(nombre="Licenciatura en Sistemas")).first()
    if not carrera_tw:
        carrera_tw = Carrera(nombre="Licenciatura en Sistemas", departamento_id=depto_info_tw.id)
        db.add(carrera_tw)
        
    db.commit() 
    db.refresh(carrera_cr)
    db.refresh(carrera_tw)
    
    # --- 4. Cuatrimestre ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        cuatri = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit() 
        db.refresh(cuatri)

    # --- 5. Usuarios (3 Profes, 10 Alumnos, Admins) ---
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
        profesores.append(p)
    
    # Alumnos (Ahora son 10)
    alumnos = []
    for i in range(1, 11): # <--- CAMBIO: 1 a 10
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
    
    # Admins
    if not db.query(AdminDepartamento).filter_by(username="admin_dpto").first():
        ad = AdminDepartamento(
            nombre="Jefe Depto CR",
            username="admin_dpto",
            hashed_password=get_password_hash("123456"),
            departamento_id=depto_info_cr.id
        )
        db.add(ad)

    if not db.query(AdminSecretaria).filter_by(username="admin_sec").first():
        sec = AdminSecretaria(
            nombre="Secretaria Académica",
            username="admin_sec",
            hashed_password=get_password_hash("123456")
        )
        db.add(sec)

    db.commit()
    # Recargar para tener IDs
    for p in profesores: db.refresh(p)
    for a in alumnos: db.refresh(a)


    # --- 6. Materias y Cursadas (Configuración Multisede) ---
    print("   > Configurando Cursadas Multisede...")
    
    # Definición de materias
    # Profesor 1 (index 0): Dará clases en CR y en TW
    # Profesor 2 (index 1): Solo CR
    # Profesor 3 (index 2): Solo CR
    
    config_cursadas = [
        # Sede Comodoro (Carrera Info)
        {"nombre": "Programación I", "desc": "Intro a prog", "profesor_idx": 0, "carrera": carrera_cr},
        {"nombre": "Álgebra Lineal", "desc": "Matemática", "profesor_idx": 1, "carrera": carrera_cr},
        {"nombre": "Sistemas Operativos", "desc": "SO Avanzado", "profesor_idx": 2, "carrera": carrera_cr},
        
        # Sede Trelew (Carrera Sistemas) - Profesor 1 viaja aquí
        {"nombre": "Bases de Datos I", "desc": "SQL y Modelado", "profesor_idx": 0, "carrera": carrera_tw}, 
    ]

    cursadas_creadas = []

    for item in config_cursadas:
        # Crear/Buscar Materia
        materia = db.query(Materia).filter_by(nombre=item["nombre"]).first()
        if not materia:
            materia = Materia(nombre=item["nombre"], descripcion=item["desc"])
            db.add(materia)
            db.commit()
            db.refresh(materia)
            
        # Vincular a la carrera correcta (CR o TW)
        if materia not in item["carrera"].materias:
            item["carrera"].materias.append(materia)
            db.add(item["carrera"])
            db.commit()
        
        # Crear Cursada
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
            print(f"     + Cursada: {materia.nombre} ({item['carrera'].departamento.sede.localidad}) -> Prof: {profesor.username}")
        
        db.refresh(cursada)
        cursadas_creadas.append(cursada)

    # --- 7. Inscripciones ---
    print("   > Inscribiendo 10 alumnos a todas las cursadas...")
    for cursada in cursadas_creadas:
        for alumno in alumnos:
            inscripcion = db.query(Inscripcion).filter_by(
                alumno_id=alumno.id, cursada_id=cursada.id
            ).first()
            if not inscripcion:
                ins = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id)
                db.add(ins)
    db.commit()

    # --- 8. Activar Encuestas ---
    print("   > Generando instancias de encuestas...")
    plantilla = db.query(Encuesta).filter(
        Encuesta.estado == EstadoInstrumento.PUBLICADA
    ).first()

    if plantilla:
        for cursada in cursadas_creadas:
            instancia = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
            if not instancia:
                # CORRECCIÓN AQUÍ: Definimos una fecha de cierre a futuro
                fecha_inicio = datetime.now()
                fecha_cierre = fecha_inicio + timedelta(days=14) # Cierra en 2 semanas

                nueva_instancia = EncuestaInstancia(
                    cursada_id=cursada.id,
                    plantilla_id=plantilla.id,
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_cierre, # <--- Asignamos la fecha de fin
                    estado=EstadoInstancia.ACTIVA
                )
                db.add(nueva_instancia)
        db.commit()
    else:
        print("     ! No se encontró plantilla publicada. Corre seed_plantilla.py primero.")

    print("✅ Carga de datos finalizada.")


def create_tables():
    from src.models import ModeloBase
    # Importar todos los modelos para registrar en metadata
    from src.materia import models
    from src.persona import models
    from src.encuestas import models
    from src.seccion import models
    from src.pregunta import models
    from src.respuesta import models
    from src.instrumento import models
    
    ModeloBase.metadata.create_all(bind=engine)

# Import necesario para datetime
from datetime import datetime

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