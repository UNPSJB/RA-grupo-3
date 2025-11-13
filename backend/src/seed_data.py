from sqlalchemy.orm import Session
from src.database import SessionLocal, engine
from src.materia.models import Materia, Cuatrimestre, Cursada
# --- CAMBIO: Importar TODOS los modelos de persona ---
from src.persona.models import Persona, Profesor, Alumno, Inscripcion, AdminSecretaria, AdminDepartamento
from src.instrumento.models import InformeSintetico, ActividadCurricularInstancia
from src.encuestas.models import EncuestaInstancia
from src.seccion.models import Seccion
from src.pregunta.models import PreguntaRedaccion, PreguntaMultipleChoice, Opcion
from src.enumerados import TipoCuatrimestre, TipoInstrumento
from src.persona.models import TipoPersona
from src.models import ModeloBase
from src.auth.services import get_password_hash

# --- (ELIMINADO) ID_ALUMNO_PRUEBA ya no es necesario ---

def seed_initial_data(db: Session):
    
    """Inserta datos iniciales de simulación si no existen."""
    
    print("Verificando/Insertando datos semilla...")

    # --- 1. Crear Cuatrimestre (si no existe) ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        print("   - Creando cuatrimestre 1C 2025...")
        cuatri = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit() 
        db.refresh(cuatri)
    else:
        print(f"   - Cuatrimestre 1C 2025 (ID: {cuatri.id}) ya existe.")

    # --- 2. Crear Materias (si no existen) ---
    materias_a_crear = [
        {"nombre": "Álgebra Lineal (Simulación)", "descripcion": "Materia de prueba para encuestas"},
        {"nombre": "Programación I (Simulación)", "descripcion": "Otra materia de prueba"},
        {"nombre": "Análisis Matemático I (Simulación)", "descripcion": "Materia adicional de prueba"},
        {"nombre": "Física I (Simulación)", "descripcion": "Cuarta materia de prueba"},
    ]
    materias_obj = {} 

    for mat_data in materias_a_crear:
        materia = db.query(Materia).filter_by(nombre=mat_data["nombre"]).first()
        if not materia:
            print(f"   - Creando materia '{mat_data['nombre']}'...")
            materia = Materia(nombre=mat_data["nombre"], descripcion=mat_data["descripcion"])
            db.add(materia)
        else:
            print(f"   - Materia '{mat_data['nombre']}' (ID: {materia.id}) ya existe.")
        materias_obj[mat_data["nombre"]] = materia 

    db.commit()
    for nombre, materia_obj in materias_obj.items():
        if materia_obj not in db: 
             try:
                 db.refresh(materia_obj)
             except Exception: 
                 print(f"   - Aviso: No se pudo refrescar la materia '{nombre}'. Recargando...")
                 materias_obj[nombre] = db.query(Materia).filter_by(nombre=nombre).first()


    # --- 3. Crear Profesor (si no existe) ---
    profe_nombre = "Profesor Simulado"
    profe = db.query(Profesor).filter(Profesor.username == "profesor1").first()
    if not profe:
        print(f"   - Creando profesor '{profe_nombre}'...")
        profe = Profesor(
            nombre=profe_nombre,
            username="profesor1",
            hashed_password=get_password_hash("profesor123")
            )
        db.add(profe)
        db.commit()
        db.refresh(profe)
    else:
         print(f"   - Profesor '{profe_nombre}' (ID: {profe.id}) ya existe.")

    # --- CAMBIO: 'admin1' ahora es de DEPARTAMENTO ---
    admin_nombre = "Admin Departamento"
    admin_user = db.query(AdminDepartamento).filter(AdminDepartamento.username == "admin1").first()
    if not admin_user:
        print(f"   - Creando admin DEPARTAMENTO '{admin_nombre}'...")
        admin_user = AdminDepartamento( 
            nombre=admin_nombre,
            username="admin1",
            hashed_password=get_password_hash("admin123")
            )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
         print(f"   - Admin DEPARTAMENTO '{admin_nombre}' (ID: {admin_user.id}) ya existe.")
         
    # --- 4. Crear Alumno de Prueba (LÓGICA CORREGIDA) ---
    alumno_nombre = "Alumno Prueba"
    # Buscamos al alumno por su 'username' único, no por un ID frágil.
    alumno_prueba = db.query(Alumno).filter(Alumno.username == "alumno1").first()
    
    if not alumno_prueba:
        print(f"   - Creando alumno de prueba '{alumno_nombre}'...")
        alumno_prueba = Alumno(
            nombre=alumno_nombre,
            username="alumno1",
            hashed_password=get_password_hash("alumno123")
        )
        db.add(alumno_prueba)
        db.commit()
        db.refresh(alumno_prueba)
    else:
        print(f"   - Alumno de prueba '{alumno_nombre}' (ID: {alumno_prueba.id}) ya existe.")

    if not alumno_prueba:
        print("   - ERROR CRÍTICO: No se pudo obtener/crear el alumno de prueba.")
        return

    print(f"   - Alumno de prueba (ID: {alumno_prueba.id}) listo.")


    # --- 5. Crear Cursadas (si no existen) ---
    cursadas_a_crear = [
        {"materia_nombre": "Álgebra Lineal (Simulación)"},
        {"materia_nombre": "Programación I (Simulación)"},
        {"materia_nombre": "Análisis Matemático I (Simulación)"}, 
        {"materia_nombre": "Física I (Simulación)"},
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
            print(f"   - Creando cursada para '{materia_obj.nombre}'...")
            cursada = Cursada(
                materia_id=materia_obj.id,
                cuatrimestre_id=cuatri.id,
                profesor_id=profe.id
            )
            db.add(cursada)
        else:
            print(f"   - Cursada para '{materia_obj.nombre}' (ID: {cursada.id}) ya existe.")
        cursadas_obj[materia_obj.nombre] = cursada

    db.commit()
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


    # --- 6. Inscribir Alumno de Prueba en Cursadas ---
    cursada_nombres = ["Álgebra Lineal (Simulación)", "Programación I (Simulación)", "Análisis Matemático I (Simulación)", "Física I (Simulación)"]
    
    for i, nombre_cursada in enumerate(cursada_nombres, 1):
        cursada = cursadas_obj.get(nombre_cursada)
        if not cursada or not hasattr(cursada, 'id'):
            print(f"   - Aviso: No se pudo obtener la Cursada {i} ({nombre_cursada}) para inscripción.")
        else:
            inscripcion = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada.id).first()
            if not inscripcion:
                print(f"   - Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada.id} ({nombre_cursada})...")
                nueva_inscripcion = Inscripcion(alumno_id=alumno_prueba.id, cursada_id=cursada.id, ha_respondido=False)
                db.add(nueva_inscripcion)
            else:
                print(f"   - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada.id} ({nombre_cursada}).")

    db.commit() # Commit final
    print("Datos semilla verificados/insertados.")

def create_tables():
     print("Creando tablas si no existen...")
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
    print("Iniciando script de carga de datos semilla...")
    create_tables()

    db = SessionLocal()
    try:
        seed_initial_data(db)
        print("Script finalizado exitosamente.")
    except Exception as e:
        print(f"ERROR durante la carga de datos semilla: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        
#Ejecutar con `python -m src.seed_data`,