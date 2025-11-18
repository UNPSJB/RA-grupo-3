from sqlalchemy.orm import Session
from sqlalchemy import select # <-- Importar 'select'
from src.database import SessionLocal, engine

# --- NUEVOS IMPORTS ---
from src.materia.models import (
    Materia, 
    Cuatrimestre, 
    Cursada, 
    Sede,           # <-- NUEVO
    Departamento,   # <-- NUEVO
    Carrera         # <-- NUEVO
)
# ----------------------

from src.persona.models import Persona, Profesor, Alumno, Inscripcion, AdminSecretaria, AdminDepartamento
from src.instrumento.models import InformeSintetico, ActividadCurricularInstancia
from src.encuestas.models import EncuestaInstancia
from src.seccion.models import Seccion
from src.pregunta.models import PreguntaRedaccion, PreguntaMultipleChoice, Opcion
from src.enumerados import TipoCuatrimestre, TipoInstrumento
from src.persona.models import TipoPersona
from src.models import ModeloBase
from src.auth.services import get_password_hash

def seed_initial_data(db: Session):
    
    """Inserta datos iniciales de simulación si no existen."""
    
    print("Verificando/Insertando datos semilla...")

    # --- 1. Crear Sedes (NUEVO) ---
    print("   - Verificando Sedes...")
    sede_cr = db.scalars(select(Sede).filter_by(localidad="Comodoro Rivadavia")).first()
    if not sede_cr:
        print("     + Creando Sede 'Comodoro Rivadavia'")
        sede_cr = Sede(localidad="Comodoro Rivadavia")
        db.add(sede_cr)
    
    sede_tw = db.scalars(select(Sede).filter_by(localidad="Trelew")).first()
    if not sede_tw:
        print("     + Creando Sede 'Trelew'")
        sede_tw = Sede(localidad="Trelew")
        db.add(sede_tw)
    
    db.commit() # Commit para obtener IDs de Sede
    db.refresh(sede_cr)
    db.refresh(sede_tw)

    # --- 2. Crear Departamentos (NUEVO) ---
    print("   - Verificando Departamentos...")
    depto_info = db.scalars(select(Departamento).filter_by(nombre="Departamento de Ingeniería Informática")).first()
    if not depto_info:
        print("     + Creando Depto. 'Ingeniería Informática'")
        depto_info = Departamento(nombre="Departamento de Ingeniería Informática", sede_id=sede_cr.id)
        db.add(depto_info)

    depto_civil = db.scalars(select(Departamento).filter_by(nombre="Departamento de Ingeniería Civil")).first()
    if not depto_civil:
        print("     + Creando Depto. 'Ingeniería Civil'")
        depto_civil = Departamento(nombre="Departamento de Ingeniería Civil", sede_id=sede_cr.id)
        db.add(depto_civil)
    
    db.commit() # Commit para obtener IDs de Depto
    db.refresh(depto_info)
    db.refresh(depto_civil)

    # --- 3. Crear Carreras (NUEVO) ---
    print("   - Verificando Carreras...")
    carrera_info = db.scalars(select(Carrera).filter_by(nombre="Ingeniería en Informática")).first()
    if not carrera_info:
        print("     + Creando Carrera 'Ingeniería en Informática'")
        carrera_info = Carrera(nombre="Ingeniería en Informática", departamento_id=depto_info.id)
        db.add(carrera_info)

    carrera_civil = db.scalars(select(Carrera).filter_by(nombre="Ingeniería Civil")).first()
    if not carrera_civil:
        print("     + Creando Carrera 'Ingeniería Civil'")
        carrera_civil = Carrera(nombre="Ingeniería Civil", departamento_id=depto_civil.id)
        db.add(carrera_civil)
        
    db.commit() # Commit para obtener IDs de Carrera
    db.refresh(carrera_info)
    db.refresh(carrera_civil)
    
    # --- 4. Crear Cuatrimestre (Sin cambios) ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        print("   - Creando cuatrimestre 1C 2025...")
        cuatri = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit() 
        db.refresh(cuatri)
    else:
        print(f"   - Cuatrimestre 1C 2025 (ID: {cuatri.id}) ya existe.")

    # --- 5. Crear Materias (MODIFICADO) ---
    print("   - Verificando Materias...")
    
    # Nombres de materias más realistas
    materias_a_crear = [
        {"nombre": "Álgebra Lineal", "descripcion": "Materia de 1er año, común a varias ingenierías"},
        {"nombre": "Programación I", "descripcion": "Materia de 1er año de Ing. Informática"},
        {"nombre": "Análisis Matemático I", "descripcion": "Materia de 1er año, común a varias ingenierías"},
        {"nombre": "Física I", "descripcion": "Materia de 1er año, común a varias ingenierías"},
        {"nombre": "Sistemas Operativos", "descripcion": "Materia de 3er año de Ing. Informática"},
        {"nombre": "Estabilidad I", "descripcion": "Materia de 2do año de Ing. Civil"},
        # --- NUEVAS MATERIAS ---
        {"nombre": "Desarrollo de Software", "descripcion": "Materia de Desarrollo"},
        {"nombre": "Ingeniería de Software I", "descripcion": "Materia de Ing. de Software 1"},
        {"nombre": "Ingeniería de Software II", "descripcion": "Materia de Ing. de Software 2"},
    ]
    materias_obj = {} 

    for mat_data in materias_a_crear:
        materia = db.query(Materia).filter_by(nombre=mat_data["nombre"]).first()
        if not materia:
            print(f"     + Creando materia '{mat_data['nombre']}'...")
            materia = Materia(nombre=mat_data["nombre"], descripcion=mat_data["descripcion"])
            db.add(materia)
        else:
            print(f"     - Materia '{mat_data['nombre']}' (ID: {materia.id}) ya existe.")
        materias_obj[mat_data["nombre"]] = materia 

    db.commit()
    
    # Refrescar objetos para asegurar que tenemos los IDs
    for nombre, materia_obj in materias_obj.items():
        if materia_obj not in db: 
             try:
                 db.refresh(materia_obj)
             except Exception: 
                 print(f"   - Aviso: No se pudo refrescar la materia '{nombre}'. Recargando...")
                 materias_obj[nombre] = db.query(Materia).filter_by(nombre=nombre).first()


    # --- 6. Vincular Materias a Carreras (MODIFICADO) ---
    print("   - Vinculando Materias a Carreras...")
    
    # Asegurarnos que los objetos carrera y materia están listos
    db.refresh(carrera_info)
    db.refresh(carrera_civil)
    
    # Materias para Ing. Informática
    materias_info_a_vincular = [
        materias_obj["Álgebra Lineal"],
        materias_obj["Análisis Matemático I"],
        materias_obj["Física I"],
        materias_obj["Programación I"],
        materias_obj["Sistemas Operativos"],
        # --- NUEVAS MATERIAS ---
        materias_obj["Desarrollo de Software"],
        materias_obj["Ingeniería de Software I"],
        materias_obj["Ingeniería de Software II"]
    ]
    
    # Filtramos las que ya están vinculadas
    materias_nuevas_para_info = [
        m for m in materias_info_a_vincular if m not in carrera_info.materias
    ]
    
    if materias_nuevas_para_info:
        print(f"     + Vinculando {len(materias_nuevas_para_info)} materias nuevas a Ing. Informática...")
        carrera_info.materias.extend(materias_nuevas_para_info)
        db.add(carrera_info)

    # Materias para Ing. Civil
    materias_civil_a_vincular = [
        materias_obj["Álgebra Lineal"],
        materias_obj["Análisis Matemático I"],
        materias_obj["Física I"],
        materias_obj["Estabilidad I"]
    ]
    materias_nuevas_para_civil = [
        m for m in materias_civil_a_vincular if m not in carrera_civil.materias
    ]
    
    if materias_nuevas_para_civil:
        print(f"     + Vinculando {len(materias_nuevas_para_civil)} materias nuevas a Ing. Civil...")
        carrera_civil.materias.extend(materias_nuevas_para_civil)
        db.add(carrera_civil)

    db.commit()

    # --- 7. Crear Usuarios de Prueba (MODIFICADO) ---
    print("   - Verificando Usuarios de Prueba...")
    
    # Diccionario para guardar todos los profesores
    profesores_obj = {}

    # Profesor de Prueba (el antiguo)
    profe_nombre = "Profesor Prueba Ingeniería"
    profe = db.query(Profesor).filter(Profesor.username == "profesor1").first()
    if not profe:
        print(f"     + Creando profesor '{profe_nombre}' (profesor1)...")
        profe = Profesor(
            nombre=profe_nombre,
            username="profesor1",
            hashed_password=get_password_hash("profesor123")
            )
        db.add(profe)
    else:
         print(f"     - Profesor '{profe_nombre}' (ID: {profe.id}) ya existe.")
    profesores_obj["profesor1"] = profe
    
    # --- NUEVOS PROFESORES ---
    # Leonardo Ordinez
    profe_leo_nombre = "Leonardo Ordinez"
    profe_leo = db.query(Profesor).filter(Profesor.username == "lordinez").first()
    if not profe_leo:
        print(f"     + Creando profesor '{profe_leo_nombre}' (lordinez)...")
        profe_leo = Profesor(
            nombre=profe_leo_nombre,
            username="lordinez",
            hashed_password=get_password_hash("profe123") # Puedes cambiar la pass
            )
        db.add(profe_leo)
    else:
         print(f"     - Profesor '{profe_leo_nombre}' (ID: {profe_leo.id}) ya existe.")
    profesores_obj["lordinez"] = profe_leo

    # Bruno Pazos
    profe_bruno_nombre = "Bruno Pazos"
    profe_bruno = db.query(Profesor).filter(Profesor.username == "bpazos").first()
    if not profe_bruno:
        print(f"     + Creando profesor '{profe_bruno_nombre}' (bpazos)...")
        profe_bruno = Profesor(
            nombre=profe_bruno_nombre,
            username="bpazos",
            hashed_password=get_password_hash("profe123") # Puedes cambiar la pass
            )
        db.add(profe_bruno)
    else:
         print(f"     - Profesor '{profe_bruno_nombre}' (ID: {profe_bruno.id}) ya existe.")
    profesores_obj["bpazos"] = profe_bruno

    # Sebastian Schanz
    profe_seba_nombre = "Sebastian Schanz"
    profe_seba = db.query(Profesor).filter(Profesor.username == "sschanz").first()
    if not profe_seba:
        print(f"     + Creando profesor '{profe_seba_nombre}' (sschanz)...")
        profe_seba = Profesor(
            nombre=profe_seba_nombre,
            username="sschanz",
            hashed_password=get_password_hash("profe123") # Puedes cambiar la pass
            )
        db.add(profe_seba)
    else:
         print(f"     - Profesor '{profe_seba_nombre}' (ID: {profe_seba.id}) ya existe.")
    profesores_obj["sschanz"] = profe_seba

    # --- FIN NUEVOS PROFESORES ---
    
    # Admin Departamento
    admin_nombre = "Admin Informática"
    admin_user = db.query(AdminDepartamento).filter(AdminDepartamento.username == "departamento1").first()
    if not admin_user:
        print(f"     + Creando admin DEPARTAMENTO '{admin_nombre}'...")
        admin_user = AdminDepartamento( 
            nombre=admin_nombre,
            username="departamento1",
            hashed_password=get_password_hash("departamento123"),
            departamento_id=depto_info.id
            )
        db.add(admin_user)
    else:
         print(f"     - Admin DEPARTAMENTO '{admin_nombre}' (ID: {admin_user.id}) ya existe.")
         
    # Secretaria
    secretaria_nombre = "Secretaria Informática"
    secretaria_user = db.query(AdminSecretaria).filter(AdminSecretaria.username == "secretaria1").first()
    if not secretaria_user:
        print(f"     + Creando secretaria  '{secretaria_nombre}'...")
        secretaria_user = AdminSecretaria( 
            nombre=secretaria_nombre,
            username="secretaria1",
            hashed_password=get_password_hash("secretaria123")
            )
        db.add(secretaria_user)
    else:
         print(f"     - secretaria '{secretaria_nombre}' (ID: {secretaria_user.id}) ya existe.")
         
    # Alumno
    alumno_nombre = "Alumno Prueba Ingeniería"
    alumno_prueba = db.query(Alumno).filter(Alumno.username == "alumno1").first()
    if not alumno_prueba:
        print(f"     + Creando alumno de prueba '{alumno_nombre}'...")
        alumno_prueba = Alumno(
            nombre=alumno_nombre,
            username="alumno1",
            hashed_password=get_password_hash("alumno123")
        )
        db.add(alumno_prueba)
    else:
        print(f"     - Alumno de prueba '{alumno_nombre}' (ID: {alumno_prueba.id}) ya existe.")

    db.commit()
    
    # Refrescar usuarios
    for profe_obj in profesores_obj.values():
        db.refresh(profe_obj)
    db.refresh(admin_user)
    if secretaria_user:
        db.refresh(secretaria_user)
    db.refresh(alumno_prueba)

    if not alumno_prueba:
        print("   - ERROR CRÍTICO: No se pudo obtener/crear el alumno de prueba.")
        return
    print(f"   - Alumno de prueba (ID: {alumno_prueba.id}) listo.")


    # --- 8. Crear Cursadas (MODIFICADO) ---
    print("   - Verificando Cursadas...")
    
    cursadas_a_crear = [
        # Cursadas de prueba originales
        {"materia_nombre": "Álgebra Lineal", "profesor_username": "profesor1"},
        {"materia_nombre": "Programación I", "profesor_username": "profesor1"},
        {"materia_nombre": "Sistemas Operativos", "profesor_username": "profesor1"},
        {"materia_nombre": "Estabilidad I", "profesor_username": "profesor1"},
        
        # --- NUEVAS CURSADAS ---
        {"materia_nombre": "Desarrollo de Software", "profesor_username": "lordinez"},
        {"materia_nombre": "Desarrollo de Software", "profesor_username": "bpazos"},
        {"materia_nombre": "Ingeniería de Software I", "profesor_username": "sschanz"},
        {"materia_nombre": "Ingeniería de Software II", "profesor_username": "sschanz"},
    ]
    cursadas_obj = {} # Para guardar las cursadas creadas

    if not cuatri:
        print("   - ERROR: Falta Cuatrimestre base para crear cursadas.")
        return

    for curs_data in cursadas_a_crear:
        materia_obj = materias_obj.get(curs_data["materia_nombre"])
        profesor_obj = profesores_obj.get(curs_data["profesor_username"])

        if not materia_obj:
            print(f"   - ERROR: No se encontró la materia '{curs_data['materia_nombre']}' para crear su cursada.")
            continue
        if not profesor_obj:
            print(f"   - ERROR: No se encontró el profesor '{curs_data['profesor_username']}' para crear su cursada.")
            continue

        cursada = db.query(Cursada).filter_by(
            materia_id=materia_obj.id,
            cuatrimestre_id=cuatri.id,
            profesor_id=profesor_obj.id
        ).first()

        if not cursada:
            print(f"     + Creando cursada para '{materia_obj.nombre}' con Prof. '{profesor_obj.nombre}'...")
            cursada = Cursada(
                materia_id=materia_obj.id,
                cuatrimestre_id=cuatri.id,
                profesor_id=profesor_obj.id
            )
            db.add(cursada)
            db.commit() # Commit por cada cursada para obtener ID
            db.refresh(cursada)
        else:
            print(f"     - Cursada para '{materia_obj.nombre}' (ID: {cursada.id}) ya existe.")
        
        # Guardamos la cursada con una clave única
        cursadas_obj[f"{materia_obj.nombre}-{profesor_obj.username}"] = cursada

    
    # --- 9. Inscribir Alumno de Prueba en Cursadas (MODIFICADO) ---
    print("   - Verificando Inscripciones...")
    
    # Nos aseguramos de que el alumno esté inscripto en TODAS las cursadas que acabamos de crear/verificar
    for i, cursada in enumerate(cursadas_obj.values(), 1):
        if not cursada or not hasattr(cursada, 'id'):
            print(f"   - Aviso: No se pudo obtener la Cursada {i} para inscripción.")
        else:
            inscripcion = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada.id).first()
            if not inscripcion:
                print(f"     + Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada.id}...")
                nueva_inscripcion = Inscripcion(alumno_id=alumno_prueba.id, cursada_id=cursada.id, ha_respondido=False)
                db.add(nueva_inscripcion)
            else:
                print(f"     - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada.id}.")

    db.commit() # Commit final
    print("Datos semilla verificados/insertados.")

def create_tables():
     print("Creando tablas si no existen...")
     # --- MODIFICADO: Solo importamos los módulos ---
     from src.materia import models
     from src.persona import models
     from src.encuestas import models
     from src.seccion import models
     from src.pregunta import models
     from src.respuesta import models
     from src.instrumento import models
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de datos semilla (v3 - Profesores Específicos)...")
    create_tables()

    db = SessionLocal()
    try:
        seed_initial_data(db)
        print("\nScript finalizado exitosamente.")
    except Exception as e:
        print(f"ERROR durante la carga de datos semilla: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        
#Ejecutar con `python -m src.seed_data`