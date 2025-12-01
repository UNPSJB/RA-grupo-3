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
    print("🌱 Iniciando carga de datos de prueba REALISTAS (v5.2 - Límite Materias)...")
    fake = Faker('es_AR')

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

    # --- 2. Departamentos ---
    print("   > Configurando Departamentos...")
    
    depto_info_cr = db.scalars(select(Departamento).filter_by(nombre="Depto. Informática (CR)")).first()
    if not depto_info_cr:
        depto_info_cr = Departamento(nombre="Depto. Informática (CR)", sede_id=sede_cr.id)
        db.add(depto_info_cr)

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
    print("   > Configurando Cuatrimestres...")
    
    # Primer Cuatrimestre
    cuatri_1 = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri_1:
        cuatri_1 = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri_1)
    
    # Segundo Cuatrimestre (AGREGAR ESTO)
    cuatri_2 = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.SEGUNDO).first()
    if not cuatri_2:
        cuatri_2 = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.SEGUNDO)
        db.add(cuatri_2)

    # (Opcional) Anual si lo necesitas
    cuatri_anual = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.ANUAL).first()
    if not cuatri_anual:
        cuatri_anual = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.ANUAL)
        db.add(cuatri_anual)

    db.commit() 
    db.refresh(cuatri_1)
    db.refresh(cuatri_2)

    # --- 5. Usuarios ---
    print("   > Creando Usuarios (Profesores y Alumnos)...")
    
    # Profesores (14)
    profesores = []
    for i in range(1, 15):
        username = f"profesor{i}"
        p = db.query(Profesor).filter_by(username=username).first()
        if not p:
            p = Profesor(
                nombre=fake.name(),
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(p)
        profesores.append(p)
    
    # Alumnos (200)
    alumnos = []
    for i in range(1, 201): 
        username = f"alumno{i}"
        a = db.query(Alumno).filter_by(username=username).first()
        if not a:
            a = Alumno(
                nombre=fake.name(),
                username=username,
                hashed_password=get_password_hash("123456")
            )
            db.add(a)
        alumnos.append(a)
    
    # Admins
    if not db.query(AdminDepartamento).filter_by(username="departamento").first():
        ad = AdminDepartamento(
            nombre="Director Dpto (TW)",
            username="departamento",
            hashed_password=get_password_hash("123456"),
            departamento_id=depto_info_tw.id
        )
        db.add(ad)

    if not db.query(AdminSecretaria).filter_by(username="admin_sec").first():
        sec = AdminSecretaria(
            nombre="Admin Secretaría",
            username="admin_sec",
            hashed_password=get_password_hash("123456")
        )
        db.add(sec)

    db.commit()
    for p in profesores: db.refresh(p)
    for a in alumnos: db.refresh(a)

    # --- 6. Materias y Cursadas ---
    print("   > Configurando Materias y Cursadas...")
    
    config_cursadas = [
        # --- CICLO BÁSICO ---
        {"nombre": "Elementos de Informática","codigo": "IF001", "desc": "Introduccion a la informatica basica", "profesor_idx": 0, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algebra","codigo": "MA045", "desc": "Algebra Lineal", "profesor_idx": 0, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Expresión de Problemas y algoritmos","codigo": "IF002", "desc": "Introduccion a la resolucion de problemas", "profesor_idx": 0, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion I","codigo": "IF003", "desc": "Introduccion a la Algoritmica y pascal", "profesor_idx": 0, "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Análisis Matemático - S","codigo": "MA048", "desc": "Analisis matematico de funciones", "profesor_idx": 1, "ciclo": CicloMateria.BASICO,"cuatri_target": 2},
        {"nombre": "Elementos de Lógica y Matemática Discreta","codigo": "MA008", "desc": "Logica proposicional y teoria de conjuntos", "profesor_idx": 1, "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Sistemas y Organizaciones","codigo": "IF004", "desc": "Vision sistemica de una organizacion", "profesor_idx": 1, "ciclo": CicloMateria.BASICO,"cuatri_target": 1},
        {"nombre": "Arquitectura de Computadoras","codigo": "IF005", "desc": "Arquitectura Harvard y Von Neumann", "profesor_idx": 2, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Algorítmica y Programacion II","codigo": "IF006", "desc": "Algoritmos de busqueda y ordenamiento avanzados", "profesor_idx": 2, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Bases de Datos I","codigo": "IF007", "desc": "Introduccion a las bases de datos relacionales", "profesor_idx": 2, "ciclo": CicloMateria.BASICO, "cuatri_target": 1},
        {"nombre": "Estadística","codigo": "MA006", "desc": "Analisis de datos en grandes cantidades", "profesor_idx": 3, "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Programación Orientada a Objetos","codigo": "IF008", "desc": "Programacion concentrada en el paradigma orientado a objetos", "profesor_idx": 3, "ciclo": CicloMateria.BASICO, "cuatri_target": 2},
        {"nombre": "Introduccion a la Concurrencia","codigo": "IF038", "desc": "Procesos paralelos y problemas de concurrencia", "profesor_idx": 4, "ciclo": CicloMateria.BASICO, "cuatri_target": 2},

        # --- CICLO SUPERIOR ---
        {"nombre": "Laboratorio de Programación y Lenguajes","codigo": "IF009", "desc": "Programacion en lenguaje C avanzado y C# orientado a objetos", "profesor_idx": 5, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Ingeniería de Software I - T","codigo": "IF040", "desc": "¿Que es el software?", "profesor_idx": 6, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Sistemas Operativos - S","codigo": "IF037", "desc": "Linux, procesos y administracion de memoria", "profesor_idx": 6, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Desarrollo de Software","codigo": "IF012", "desc": "Metodologias agiles y produccion de software real", "profesor_idx": 6, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Fundamentos Teóricos de Informática","codigo": "IF013", "desc": "Lenguajes regulares y grafos", "profesor_idx": 7, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Ingeniería de Software II","codigo": "IF043", "desc": "Nuevos diagramas para la produccion de software", "profesor_idx": 7, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Redes y Transmisión de Datos","codigo": "IF019", "desc": "Todo lo relacionado a Redes e internet", "profesor_idx": 8, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Base de Datos II - S","codigo": "IF044", "desc": "Administracion de bases de datos y funciones SQL", "profesor_idx": 8, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Paradigmas y Lenguajes de Programación - T","codigo": "IF020", "desc": "Paradigma OOP, funcional y logico", "profesor_idx": 9, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Administración de Redes y Seguridad","codigo": "IF047", "desc": "Seguridad informatica aplicada", "profesor_idx": 9, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Ingeniería de Software III - T","codigo": "IF048", "desc": "Software en produccion bien documentado", "profesor_idx": 9, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Aspectos Legales y Profesionales","codigo": "IF016", "desc": "Marco legal informatico", "profesor_idx": 9, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 2},
        {"nombre": "Sistemas Distribuidos","codigo": "IF022", "desc": "Computacion distribuida", "profesor_idx": 10, "ciclo": CicloMateria.SUPERIOR, "cuatri_target": 1},
        {"nombre": "Administracion de Proyectos","codigo": "IF049", "desc": "Gestion de proyectos de software", "profesor_idx": 10, "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 1},
        {"nombre": "Aplicaciones Web","codigo": "IF050", "desc": "Desarrollo web moderno", "profesor_idx": 11, "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 1},
        {"nombre": "Taller de Nuevas Tecnologias","codigo": "IF017", "desc": "Aprendizaje de tecnologias emergentes", "profesor_idx": 12, "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
        {"nombre": "Modelos y Simulación","codigo": "IF027", "desc": "Simulacion de sistemas discretos y continuos", "profesor_idx": 13, "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
        {"nombre": "Planificación y Gestión de Sistemas de Información","codigo": "IF053", "desc": "Gestion estrategica de TI", "profesor_idx": 13, "ciclo": CicloMateria.SUPERIOR,"cuatri_target": 2},
    ]

    cursadas_creadas = []

    for item in config_cursadas:
        # 1. Crear/Buscar Materia (Esto se mantiene igual)
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
            
        if materia not in carrera_tw.materias:
            carrera_tw.materias.append(materia)
            db.add(carrera_tw)
            db.commit()
        
        # 2. Asignar Profesor (Esto se mantiene igual)
        prof_idx = item["profesor_idx"]
        if prof_idx >= len(profesores): prof_idx = 0 
        profesor = profesores[prof_idx]
        
        # --- 3. LÓGICA DE SELECCIÓN DE CUATRIMESTRE (NUEVO) ---
        # Leemos el campo 'cuatri_target' que agregaste en el paso anterior.
        # Si no existe, asume 1 por defecto.
        target_periodo = item.get("cuatri_target", 1) 
        
        # Elegimos la variable del objeto Cuatrimestre que corresponda
        # (Asegúrate de haber creado las variables cuatri_1 y cuatri_2 arriba)
        if target_periodo == 2:
            cuatri_obj = cuatri_2
        else:
            cuatri_obj = cuatri_1
            
        # --- FIN LÓGICA NUEVA ---

        # 4. Crear Cursada usando el cuatrimestre seleccionado (cuatri_obj)
        cursada = db.query(Cursada).filter_by(
            materia_id=materia.id, 
            cuatrimestre_id=cuatri_obj.id  # <--- CAMBIO CLAVE AQUÍ
        ).first()
        
        if not cursada:
            cursada = Cursada(
                materia_id=materia.id,
                cuatrimestre_id=cuatri_obj.id, # <--- Y AQUÍ
                profesor_id=profesor.id
            )
            db.add(cursada)
            db.commit()
            print(f"     + Cursada ({'2º' if target_periodo==2 else '1º'} Cuatri): {materia.nombre} -> Prof: {profesor.nombre}")
        
        db.refresh(cursada)
        cursadas_creadas.append(cursada)

    # --- 7. Inscripciones (MODIFICADO) ---
    print(f"   > Inscribiendo alumnos (Máx 4 materias por alumno)...")
    import random
    
    total_inscripciones = 0
    
    # Iteramos por CADA ALUMNO para controlar su carga
    for alumno in alumnos:
        # Elegimos cuántas materias va a cursar este alumno (de 1 a 4)
        # Nota: Usamos min() para no romper si hay menos de 4 materias creadas en total
        cantidad_materias = random.randint(1, min(4, len(cursadas_creadas)))
        
        # Seleccionamos aleatoriamente ESA cantidad de materias de la lista total
        mis_cursadas = random.sample(cursadas_creadas, k=cantidad_materias)
        
        for cursada in mis_cursadas:
            # Verificar si ya existe (idempotencia)
            inscripcion = db.query(Inscripcion).filter_by(
                alumno_id=alumno.id, cursada_id=cursada.id
            ).first()
            
            if not inscripcion:
                ins = Inscripcion(alumno_id=alumno.id, cursada_id=cursada.id)
                db.add(ins)
                total_inscripciones += 1
                
    db.commit()
    print(f"   > Se generaron {total_inscripciones} inscripciones en total.")
    print("✅ Carga de datos base finalizada.")

def create_tables():
    print("Verificando tablas...")
    from src.materia import models as materia_models
    from src.persona import models as persona_models
    from src.encuestas import models as encuestas_models
    from src.seccion import models as seccion_models
    from src.pregunta import models as pregunta_models
    from src.respuesta import models as respuesta_models
    from src.instrumento import models as instrumento_models
    
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