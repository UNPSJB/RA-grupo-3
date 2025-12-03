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
    print("🌱 Iniciando carga de datos MASIVA (v7.0 - 4 Sedes)...")
    fake = Faker('es_AR')

    # ==========================================
    # 1. SEDES, DEPARTAMENTOS Y CARRERAS
    # ==========================================
    print("   > 1. Configurando Estructura Académica (CR, TW, PM, EQ)...")
    
    sedes_data = [
        {"localidad": "Comodoro Rivadavia", "depto": "Depto. Informática (CR)", "carrera": "Ingeniería en Informática", "admin_user": "admin_cr", "admin_name": "Director Dpto (CR)"},
        {"localidad": "Trelew", "depto": "Depto. Informática (TW)", "carrera": "Licenciatura en Sistemas", "admin_user": "admin_tw", "admin_name": "Director Dpto (TW)"},
        {"localidad": "Puerto Madryn", "depto": "Depto. Informática (PM)", "carrera": "Licenciatura en Informática", "admin_user": "admin_pm", "admin_name": "Director Dpto (PM)"},
        {"localidad": "Esquel", "depto": "Depto. Informática (EQ)", "carrera": "Analista Programador Univ.", "admin_user": "admin_eq", "admin_name": "Director Dpto (EQ)"}
    ]

    carreras_objetos = {} # Para guardar las carreras creadas y usarlas después

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

        # Admin
        if not db.query(AdminDepartamento).filter_by(username=s_data["admin_user"]).first():
            admin = AdminDepartamento(
                nombre=s_data["admin_name"],
                username=s_data["admin_user"],
                hashed_password=get_password_hash("123456"),
                departamento_id=depto.id
            )
            db.add(admin)
    
    # Secretaría
    if not db.query(AdminSecretaria).filter_by(username="admin_sec").first():
        sec = AdminSecretaria(
            nombre="Admin Secretaría",
            username="admin_sec",
            hashed_password=get_password_hash("123456")
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
    # 3. USUARIOS (PROFESORES Y ALUMNOS)
    # ==========================================
    print("   > 3. Creando Usuarios Masivos...")

    # Profesores (60 en total: 15 por sede)
    profesores_por_sede = {
        "Comodoro Rivadavia": [],
        "Trelew": [],
        "Puerto Madryn": [],
        "Esquel": []
    }
    
    total_profes = 60
    # Distribución simple: 1-15 CR, 16-30 TW, 31-45 PM, 46-60 EQ
    
    for i in range(1, total_profes + 1):
        username = f"profesor{i}"
        p = db.query(Profesor).filter_by(username=username).first()
        if not p:
            p = Profesor(
                nombre=fake.name(),
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(p)
        
        # Asignar a sede
        if i <= 15: profesores_por_sede["Comodoro Rivadavia"].append(p)
        elif i <= 30: profesores_por_sede["Trelew"].append(p)
        elif i <= 45: profesores_por_sede["Puerto Madryn"].append(p)
        else: profesores_por_sede["Esquel"].append(p)

    # Alumnos (800 en total: 200 por sede)
    alumnos_por_sede = {
        "Comodoro Rivadavia": [],
        "Trelew": [],
        "Puerto Madryn": [],
        "Esquel": []
    }

    total_alumnos = 800
    for i in range(1, total_alumnos + 1): 
        username = f"alumno{i}"
        a = db.query(Alumno).filter_by(username=username).first()
        if not a:
            a = Alumno(
                nombre=fake.name(),
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(a)
        
        if i <= 200: alumnos_por_sede["Comodoro Rivadavia"].append(a)
        elif i <= 400: alumnos_por_sede["Trelew"].append(a)
        elif i <= 600: alumnos_por_sede["Puerto Madryn"].append(a)
        else: alumnos_por_sede["Esquel"].append(a)
    
    db.commit()
    
    # Refrescar para asegurar IDs
    # (Opcional si no se usan inmediatamente, pero buena práctica)

    # ==========================================
    # 4. MATERIAS Y CURSADAS (REPLICADAS EN 4 SEDES)
    # ==========================================
    print("   > 4. Configurando Materias y Cursadas en 4 Sedes...")
    
    config_materias = [
        # --- CICLO BÁSICO ---
        {"nombre": "Elementos de Informática","codigo": "IF001", "desc": "Introduccion a la informatica basica", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algebra","codigo": "MA045", "desc": "Algebra Lineal", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Expresión de Problemas y algoritmos","codigo": "IF002", "desc": "Introduccion a la resolucion de problemas", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion I","codigo": "IF003", "desc": "Introduccion a la Algoritmica y pascal", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Análisis Matemático","codigo": "MA048", "desc": "Analisis matematico de funciones", "ciclo": CicloMateria.BASICO,"cuatri_target": 2},
        {"nombre": "Matemática Discreta","codigo": "MA008", "desc": "Logica proposicional y teoria de conjuntos", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Sistemas y Organizaciones","codigo": "IF004", "desc": "Vision sistemica de una organizacion", "ciclo": CicloMateria.BASICO,"cuatri_target": 1},
        {"nombre": "Arquitectura de Computadoras","codigo": "IF005", "desc": "Arquitectura Harvard y Von Neumann", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion II","codigo": "IF006", "desc": "Algoritmos de busqueda y ordenamiento avanzados", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Bases de Datos I","codigo": "IF007", "desc": "Introduccion a las bases de datos relacionales", "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Estadística","codigo": "MA006", "desc": "Analisis de datos en grandes cantidades", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Programación Orientada a Objetos","codigo": "IF008", "desc": "Programacion concentrada en el paradigma orientado a objetos", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Introduccion a la Concurrencia","codigo": "IF038", "desc": "Procesos paralelos y problemas de concurrencia", "ciclo": CicloMateria.BASICO, "cuatri_target": 2},

        # --- CICLO SUPERIOR ---
        {"nombre": "Laboratorio de Programación","codigo": "IF009", "desc": "Programacion en lenguaje C avanzado", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Ingeniería de Software I","codigo": "IF040", "desc": "¿Que es el software?", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Sistemas Operativos","codigo": "IF037", "desc": "Linux, procesos y administracion de memoria", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Desarrollo de Software","codigo": "IF012", "desc": "Metodologias agiles y produccion de software real", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Teoria de la Computación","codigo": "IF013", "desc": "Lenguajes regulares y grafos", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Ingeniería de Software II","codigo": "IF043", "desc": "Nuevos diagramas para la produccion de software", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Redes y Transmisión de Datos","codigo": "IF019", "desc": "Todo lo relacionado a Redes e internet", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Base de Datos II","codigo": "IF044", "desc": "Administracion de bases de datos y funciones SQL", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Paradigmas de Programación","codigo": "IF020", "desc": "Paradigma OOP, funcional y logico", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Seguridad Informática","codigo": "IF047", "desc": "Seguridad informatica aplicada", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Ingeniería de Software III","codigo": "IF048", "desc": "Software en produccion bien documentado", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Aspectos Legales","codigo": "IF016", "desc": "Marco legal informatico", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Sistemas Distribuidos","codigo": "IF022", "desc": "Computacion distribuida", "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Administracion de Proyectos","codigo": "IF049", "desc": "Gestion de proyectos de software", "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 1},
        {"nombre": "Aplicaciones Web","codigo": "IF050", "desc": "Desarrollo web moderno", "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 1},
        {"nombre": "Taller de Nuevas Tecnologias","codigo": "IF017", "desc": "Aprendizaje de tecnologias emergentes", "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
        {"nombre": "Simulación","codigo": "IF027", "desc": "Simulacion de sistemas discretos y continuos", "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
        {"nombre": "Gestión de Sistemas","codigo": "IF053", "desc": "Gestion estrategica de TI", "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
    ]

    cursadas_creadas_por_sede = { k["localidad"]: [] for k in sedes_data }

    def crear_cursada(item, carrera, profesores_locales):
        # Materia (reutilizamos o creamos)
        materia = db.query(Materia).filter_by(codigo=item["codigo"]).first()
        if not materia:
            materia = Materia(
                nombre=item["nombre"],
                codigo=item["codigo"], 
                descripcion=item["desc"],
                ciclo=item["ciclo"]
            )
            db.add(materia)
            db.commit()
            db.refresh(materia)
        
        # Asociar a carrera si falta
        if materia not in carrera.materias:
            carrera.materias.append(materia)
            db.add(carrera)
            db.commit()

        # Profesor (Round Robin local)
        if not profesores_locales: return None
        prof_idx = hash(item["nombre"]) % len(profesores_locales)
        profesor = profesores_locales[prof_idx]

        # Cuatrimestre
        target_periodo = item.get("cuatri_target", 1) 
        cuatri_obj = cuatri_2 if target_periodo == 2 else cuatri_1

        # Cursada
        cursada = db.query(Cursada).filter_by(
            materia_id=materia.id, 
            cuatrimestre_id=cuatri_obj.id,
            profesor_id=profesor.id
        ).first()
        
        if not cursada:
            cursada = Cursada(
                materia_id=materia.id,
                cuatrimestre_id=cuatri_obj.id,
                profesor_id=profesor.id
            )
            db.add(cursada)
            db.commit()
            db.refresh(cursada)
        
        return cursada

    # Generar para las 4 sedes
    for nombre_sede in ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"]:
        print(f"     > Generando cursadas para {nombre_sede}...")
        carrera_local = carreras_objetos[nombre_sede]
        profesores_locales = profesores_por_sede[nombre_sede]
        
        for item in config_materias:
            c = crear_cursada(item, carrera_local, profesores_locales)
            if c:
                cursadas_creadas_por_sede[nombre_sede].append(c)

    # ==========================================
    # 5. INSCRIPCIONES
    # ==========================================
    print(f"   > 5. Inscribiendo alumnos masivamente...")
    
    total_inscripciones = 0
    
    for nombre_sede, lista_cursadas in cursadas_creadas_por_sede.items():
        alumnos_locales = alumnos_por_sede[nombre_sede]
        
        for alumno in alumnos_locales:
            cantidad = random.randint(1, 5)
            mis_cursadas = random.sample(lista_cursadas, k=min(cantidad, len(lista_cursadas)))
            
            for cursada in mis_cursadas:
                inscripcion = db.query(Inscripcion).filter_by(
                    alumno_id=alumno.id, cursada_id=cursada.id
                ).first()
                
                if not inscripcion:
                    ins = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id)
                    db.add(ins)
                    total_inscripciones += 1
    
    db.commit()
    print(f"   > Se generaron {total_inscripciones} inscripciones en total.")
    print("\n✅ Carga de datos base finalizada EXITOSAMENTE (4 Sedes).")
    print("   - Admins: admin_cr, admin_tw, admin_pm, admin_eq / 123456")
    print("   - Profesores: 60 creados (15 por sede).")
    print("   - Alumnos: 800 creados (200 por sede).")

def create_tables():
    print("Verificando tablas...")
    from src.models import ModeloBase
    # Importar todos los modelos para que SQLAlchemy los reconozca
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