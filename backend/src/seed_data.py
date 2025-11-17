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


    # --- 6. Vincular Materias a Carreras (NUEVO) ---
    print("   - Vinculando Materias a Carreras...")
    
    # Asegurarnos que los objetos carrera y materia están listos
    db.refresh(carrera_info)
    db.refresh(carrera_civil)
    
    # Materias para Ing. Informática
    if not any(m.nombre == "Programación I" for m in carrera_info.materias):
        print("     + Vinculando materias a Ing. Informática...")
        carrera_info.materias.extend([
            materias_obj["Álgebra Lineal"],
            materias_obj["Análisis Matemático I"],
            materias_obj["Física I"],
            materias_obj["Programación I"],
            materias_obj["Sistemas Operativos"]
        ])
        db.add(carrera_info)

    # Materias para Ing. Civil
    if not any(m.nombre == "Estabilidad I" for m in carrera_civil.materias):
        print("     + Vinculando materias a Ing. Civil...")
        carrera_civil.materias.extend([
            materias_obj["Álgebra Lineal"],
            materias_obj["Análisis Matemático I"],
            materias_obj["Física I"],
            materias_obj["Estabilidad I"]
        ])
        db.add(carrera_civil)

    db.commit()

    # --- 7. Crear Usuarios de Prueba (MODIFICADO) ---
    print("   - Verificando Usuarios de Prueba...")
    
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

    # Profesor
    profe_nombre = "Profesor Prueba Ingeniería"
    profe = db.query(Profesor).filter(Profesor.username == "profesor1").first()
    if not profe:
        print(f"     + Creando profesor '{profe_nombre}'...")
        profe = Profesor(
            nombre=profe_nombre,
            username="profesor1",
            hashed_password=get_password_hash("profesor123")
            )
        db.add(profe)
    else:
         print(f"     - Profesor '{profe_nombre}' (ID: {profe.id}) ya existe.")

    # Departamento
    admin_nombre = "Admin Informática"
    admin_user = db.query(AdminDepartamento).filter(AdminDepartamento.username == "departamento1").first()
    if not admin_user:
        print(f"     + Creando admin DEPARTAMENTO '{admin_nombre}'...")
        admin_user = AdminDepartamento( 
            nombre=admin_nombre,
            username="departamento1",
            hashed_password=get_password_hash("departamento123")
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

    db.commit()
    
    # Refrescar usuarios
    db.refresh(profe)
    db.refresh(admin_user)
    db.refresh(alumno_prueba)
    if secretaria_user:
        db.refresh(secretaria_user)

    if not alumno_prueba:
        print("   - ERROR CRÍTICO: No se pudo obtener/crear el alumno de prueba.")
        return
    print(f"   - Alumno de prueba (ID: {alumno_prueba.id}) listo.")


    # --- 8. Crear Cursadas (MODIFICADO) ---
    print("   - Verificando Cursadas...")
    
    # Usamos las materias realistas
    cursadas_a_crear = [
        {"materia_nombre": "Álgebra Lineal"},
        {"materia_nombre": "Programación I"},
        {"materia_nombre": "Sistemas Operativos"}, 
        {"materia_nombre": "Estabilidad I"},
    ]
    cursadas_obj = {}

    if not cuatri or not profe:
        print("   - ERROR: Falta Cuatrimestre o Profesor base para crear cursadas.")
        return

    for curs_data in cursadas_a_crear:
        materia_obj = materias_obj.get(curs_data["materia_nombre"])
        if not materia_obj:
            print(f"   - ERROR: No se encontró la materia '{curs_data['materia_nombre']}' para crear su cursada.")
            continue

        cursada = db.query(Cursada).filter_by(
            materia_id=materia_obj.id,
            cuatrimestre_id=cuatri.id,
            profesor_id=profe.id
        ).first()

        if not cursada:
            print(f"     + Creando cursada para '{materia_obj.nombre}'...")
            cursada = Cursada(
                materia_id=materia_obj.id,
                cuatrimestre_id=cuatri.id,
                profesor_id=profe.id
            )
            db.add(cursada)
        else:
            print(f"     - Cursada para '{materia_obj.nombre}' (ID: {cursada.id}) ya existe.")
        cursadas_obj[materia_obj.nombre] = cursada

    db.commit()
    
    # Refrescar cursadas
    for nombre, cursada_obj in cursadas_obj.items():
         if cursada_obj not in db:
             try:
                 db.refresh(cursada_obj)
             except Exception:
                  print(f"   - Aviso: No se pudo refrescar la cursada para '{nombre}'. Recargando...")
                  materia_correspondiente = materias_obj.get(nombre)
                  if materia_correspondiente:
                      cursadas_obj[nombre] = db.query(Cursada).filter_by(
                          materia_id=materia_correspondiente.id,
                          cuatrimestre_id=cuatri.id,
                          profesor_id=profe.id
                      ).first()


    # --- 9. Inscribir Alumno de Prueba en Cursadas (MODIFICADO) ---
    print("   - Verificando Inscripciones...")
    
    # Usamos las cursadas que acabamos de crear
    cursada_nombres = ["Álgebra Lineal", "Programación I", "Sistemas Operativos", "Estabilidad I"]
    
    for i, nombre_cursada in enumerate(cursada_nombres, 1):
        cursada = cursadas_obj.get(nombre_cursada)
        if not cursada or not hasattr(cursada, 'id'):
            print(f"   - Aviso: No se pudo obtener la Cursada {i} ({nombre_cursada}) para inscripción.")
        else:
            inscripcion = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada.id).first()
            if not inscripcion:
                print(f"     + Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada.id} ({nombre_cursada})...")
                nueva_inscripcion = Inscripcion(alumno_id=alumno_prueba.id, cursada_id=cursada.id, ha_respondido=False)
                db.add(nueva_inscripcion)
            else:
                print(f"     - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada.id} ({nombre_cursada}).")

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
    print("Iniciando script de carga de datos semilla (v2 - UNPSJB)...")
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