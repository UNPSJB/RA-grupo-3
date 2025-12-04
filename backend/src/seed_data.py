import random
from faker import Faker
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.database import SessionLocal, engine
from datetime import datetime

# Imports de Modelos
from src.materia.models import (
    Materia, 
    Cuatrimestre, 
    Cursada, 
    Sede,           
    Departamento,   
    Carrera         
)
from src.persona.models import (
    Profesor, 
    Alumno, 
    Inscripcion, 
    AdminDepartamento, 
    AdminSecretaria
)
from src.enumerados import TipoCuatrimestre, CicloMateria
from src.auth.services import get_password_hash
from src.models import ModeloBase

def seed_initial_data(db: Session):
    print("🌱 Iniciando carga de datos MASIVA (Aislada por Sede)...")
    fake = Faker('es_AR')

    # ==========================================
    # 1. SEDES, DEPARTAMENTOS Y CARRERAS
    # ==========================================
    print("   > 1. Configurando Estructura Académica...")
    
    sedes_data = [
        {"localidad": "Comodoro Rivadavia", "depto": "Depto. Informática (CR)", "carrera": "Ingeniería en Informática", "admin_user": "admin_cr", "admin_name": "Director Dpto (CR)", "sufijo": "CR"},
        {"localidad": "Trelew", "depto": "Depto. Informática (TW)", "carrera": "Licenciatura en Sistemas", "admin_user": "admin_tw", "admin_name": "Director Dpto (TW)", "sufijo": "TW"},
        {"localidad": "Puerto Madryn", "depto": "Depto. Informática (PM)", "carrera": "Licenciatura en Informática", "admin_user": "admin_pm", "admin_name": "Director Dpto (PM)", "sufijo": "PM"},
        {"localidad": "Esquel", "depto": "Depto. Informática (EQ)", "carrera": "Analista Programador Univ.", "admin_user": "admin_eq", "admin_name": "Director Dpto (EQ)", "sufijo": "EQ"}
    ]

    carreras_objetos = {}
    sufijos_sedes = {} # Mapa Localidad -> Sufijo

    for s_data in sedes_data:
        # Sede
        sede = db.scalars(select(Sede).filter_by(localidad=s_data["localidad"])).first()
        if not sede:
            sede = Sede(localidad=s_data["localidad"])
            db.add(sede)
        db.commit()
        db.refresh(sede)

        # Depto
        depto = db.scalars(select(Departamento).filter_by(nombre=s_data["depto"])).first()
        if not depto:
            depto = Departamento(nombre=s_data["depto"], sede_id=sede.id)
            db.add(depto)
        db.commit()
        db.refresh(depto)

        # Carrera
        carrera = db.scalars(select(Carrera).filter_by(nombre=s_data["carrera"])).first()
        if not carrera:
            carrera = Carrera(nombre=s_data["carrera"], departamento_id=depto.id)
            db.add(carrera)
        db.commit()
        db.refresh(carrera)
        
        carreras_objetos[s_data["localidad"]] = carrera
        sufijos_sedes[s_data["localidad"]] = s_data["sufijo"]

        # Admin
        if not db.query(AdminDepartamento).filter_by(username=s_data["admin_user"]).first():
            admin = AdminDepartamento(
                nombre=s_data["admin_name"],
                username=s_data["admin_user"],
                hashed_password=get_password_hash("123456"),
                departamento_id=depto.id,
                tipo="ADMIN_DEPARTAMENTO" # Importante para el discriminador
            )
            db.add(admin)
    
    # Secretaría
    if not db.query(AdminSecretaria).filter_by(username="admin_sec").first():
        sec = AdminSecretaria(
            nombre="Admin Secretaría",
            username="admin_sec",
            hashed_password=get_password_hash("123456"),
            tipo="ADMIN_SECRETARIA"
        )
        db.add(sec)
    
    db.commit()

    # ==========================================
    # 2. CUATRIMESTRES
    # ==========================================
    print("   > 2. Configurando Cuatrimestres...")
    
    cuatri_1 = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri_1:
        cuatri_1 = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri_1)
    
    cuatri_2 = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.SEGUNDO).first()
    if not cuatri_2:
        cuatri_2 = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.SEGUNDO)
        db.add(cuatri_2)

    cuatri_anual = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.ANUAL).first()
    if not cuatri_anual:
        cuatri_anual = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.ANUAL)
        db.add(cuatri_anual)

    db.commit() 
    db.refresh(cuatri_1)
    db.refresh(cuatri_2)

    # ==========================================
    # 3. USUARIOS
    # ==========================================
    print("   > 3. Creando Usuarios...")

    profesores_por_sede = { k["localidad"]: [] for k in sedes_data }
    
    # Profesores (19 total)
    for i in range(1, 20):
        username = f"profesor{i}"
        p = db.query(Profesor).filter_by(username=username).first()
        if not p:
            p = Profesor(nombre=fake.name(), username=username, hashed_password=get_password_hash("123456"), tipo="DOCENTE")
            db.add(p)
        
        if i <= 15: profesores_por_sede["Comodoro Rivadavia"].append(p)
        elif i <= 30: profesores_por_sede["Trelew"].append(p)
        elif i <= 45: profesores_por_sede["Puerto Madryn"].append(p)
        else: profesores_por_sede["Esquel"].append(p)

    # Alumnos (300 total)
    alumnos_por_sede = { k["localidad"]: [] for k in sedes_data }

    for i in range(1, 301): 
        username = f"alumno{i}"
        a = db.query(Alumno).filter_by(username=username).first()
        if not a:
            a = Alumno(nombre=fake.name(), username=username, hashed_password=get_password_hash("123456"), tipo="ALUMNO")
            db.add(a)
        
        if i <= 200: alumnos_por_sede["Comodoro Rivadavia"].append(a)
        elif i <= 400: alumnos_por_sede["Trelew"].append(a)
        elif i <= 600: alumnos_por_sede["Puerto Madryn"].append(a)
        else: alumnos_por_sede["Esquel"].append(a)
    
    db.commit()

    # ==========================================
    # 4. MATERIAS UNICAS POR SEDE
    # ==========================================
    print("   > 4. Configurando Materias (Aisladas por código de sede)...")
    
    config_materias = [
        {"nombre": "Elementos de Informática","codigo": "IF001", "desc": "Introduccion", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algebra","codigo": "MA045", "desc": "Algebra Lineal", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Expresión de Problemas y algoritmos","codigo": "IF002", "desc": "Resolucion problemas", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion I","codigo": "IF003", "desc": "Pascal", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Análisis Matemático","codigo": "MA048", "desc": "Analisis", "ciclo": CicloMateria.BASICO,"cuatri_target": 2},
        {"nombre": "Matemática Discreta","codigo": "MA008", "desc": "Logica", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Sistemas y Organizaciones","codigo": "IF004", "desc": "Sistemas", "ciclo": CicloMateria.BASICO,"cuatri_target": 1},
        {"nombre": "Arquitectura de Computadoras","codigo": "IF005", "desc": "Hardware", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion II","codigo": "IF006", "desc": "Algoritmos", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Bases de Datos I","codigo": "IF007", "desc": "SQL", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Estadística","codigo": "MA006", "desc": "Probabilidad", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Programación Orientada a Objetos","codigo": "IF008", "desc": "POO", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Laboratorio de Programación","codigo": "IF009", "desc": "C avanzado", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Ingeniería de Software I","codigo": "IF040", "desc": "Soft", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Sistemas Operativos","codigo": "IF037", "desc": "OS", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Desarrollo de Software","codigo": "IF012", "desc": "Agile", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Teoria de la Computación","codigo": "IF013", "desc": "Automatas", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Redes y Transmisión de Datos","codigo": "IF019", "desc": "Redes", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Paradigmas de Programación","codigo": "IF020", "desc": "Paradigmas", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Seguridad Informática","codigo": "IF047", "desc": "Seguridad", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
    ]

    cursadas_creadas_por_sede = { k["localidad"]: [] for k in sedes_data }

    for nombre_sede in ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"]:
        print(f"     > Generando cursadas para {nombre_sede}...")
        carrera_local = carreras_objetos[nombre_sede]
        profesores_locales = profesores_por_sede[nombre_sede]
        suffix = sufijos_sedes[nombre_sede] # CR, TW, PM, EQ
        
        for item in config_materias:
            # --- TRUCO: Código único por sede ---
            codigo_unico = f"{item['codigo']}-{suffix}"
            
            materia = db.query(Materia).filter_by(codigo=codigo_unico).first()
            if not materia:
                materia = Materia(
                    nombre=item["nombre"], 
                    codigo=codigo_unico, # EJ: IF001-TW
                    descripcion=item["desc"],
                    ciclo=item["ciclo"]
                )
                db.add(materia)
                db.commit()
            
            # Asociar
            if materia not in carrera_local.materias:
                carrera_local.materias.append(materia)
                db.commit()

            # Cursada
            if profesores_locales:
                prof_idx = hash(item["nombre"]) % len(profesores_locales)
                profesor = profesores_locales[prof_idx]
                target_periodo = item.get("cuatri_target", 1) 
                cuatri_obj = cuatri_2 if target_periodo == 2 else cuatri_1

                cursada = db.query(Cursada).filter_by(materia_id=materia.id, cuatrimestre_id=cuatri_obj.id).first()
                if not cursada:
                    cursada = Cursada(materia_id=materia.id, cuatrimestre_id=cuatri_obj.id, profesor_id=profesor.id)
                    db.add(cursada)
                    db.commit()
                
                cursadas_creadas_por_sede[nombre_sede].append(cursada)

    # ==========================================
    # 5. INSCRIPCIONES
    # ==========================================
    print(f"   > 5. Inscribiendo alumnos...")
    
    for nombre_sede, lista_cursadas in cursadas_creadas_por_sede.items():
        alumnos_locales = alumnos_por_sede[nombre_sede]
        for alumno in alumnos_locales:
            if not lista_cursadas: continue
            mis_cursadas = random.sample(lista_cursadas, k=min(3, len(lista_cursadas)))
            for cursada in mis_cursadas:
                if not db.query(Inscripcion).filter_by(alumno_id=alumno.id, cursada_id=cursada.id).first():
                    db.add(Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id))
    
    db.commit()
    print("\n✅ Carga finalizada (Estructura Aislada).")

def create_tables():
    from src.models import ModeloBase
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
        db.rollback()
    finally:
        db.close()