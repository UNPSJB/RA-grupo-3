# src/seed_data.py
from sqlalchemy.orm import Session
# Asegúrate que SessionLocal esté definido en database.py y lo importe correctamente
from src.database import SessionLocal, engine
# Importa todos los modelos necesarios
from src.materia.models import Materia, Cuatrimestre, Cursada
from src.persona.models import Persona, Profesor, Alumno, Inscripcion
# Importa los Enums necesarios
from src.enumerados import TipoCuatrimestre
from src.persona.models import TipoPersona # Asumiendo que está definido en persona.models
# Importa ModeloBase para crear tablas si no existen (opcional)
from src.models import ModeloBase

# --- CONFIGURACIÓN ---
# ID que usará tu dependencia get_current_alumno simulada
ID_ALUMNO_PRUEBA = 2

def seed_initial_data(db: Session):
    """
    Inserta datos iniciales de simulación si no existen.
    Crea: 1 Cuatrimestre, 4 Materias, 1 Profesor, 1 Alumno, 4 Cursadas, 1 Inscripcion.
    """
    print("Verificando/Insertando datos semilla...")

    # --- 1. Crear Cuatrimestre (si no existe) ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=2025, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        print("   - Creando cuatrimestre 1C 2025...")
        cuatri = Cuatrimestre(anio=2025, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit() # Commit para obtener el ID
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
    materias_obj = {} # Diccionario para guardar los objetos Materia

    for mat_data in materias_a_crear:
        materia = db.query(Materia).filter_by(nombre=mat_data["nombre"]).first()
        if not materia:
            print(f"   - Creando materia '{mat_data['nombre']}'...")
            materia = Materia(nombre=mat_data["nombre"], descripcion=mat_data["descripcion"])
            db.add(materia)
        else:
            print(f"   - Materia '{mat_data['nombre']}' (ID: {materia.id}) ya existe.")
        materias_obj[mat_data["nombre"]] = materia # Guarda el objeto (nuevo o existente)

    # Commit intermedio para asegurar IDs antes de crear Cursadas
    db.commit()
    # Refrescar solo si es necesario (si el objeto no estaba ya en la sesión persistente)
    for nombre, materia_obj in materias_obj.items():
        if materia_obj not in db: # Chequea si el objeto está detached o transient
             try:
                 db.refresh(materia_obj)
             except Exception: # Evita errores si el objeto ya fue borrado o no existe
                 print(f"   - Aviso: No se pudo refrescar la materia '{nombre}'. Recargando...")
                 materias_obj[nombre] = db.query(Materia).filter_by(nombre=nombre).first()


    # --- 3. Crear Profesor (si no existe) ---
    profe_nombre = "Profesor Simulado"
    profe = db.query(Profesor).filter(Profesor.nombre == profe_nombre).first()
    if not profe:
        print(f"   - Creando profesor '{profe_nombre}'...")
        profe = Profesor(nombre=profe_nombre)
        db.add(profe)
        db.commit()
        db.refresh(profe)
    else:
         print(f"   - Profesor '{profe_nombre}' (ID: {profe.id}) ya existe.")


    # --- 4. Crear Alumno de Prueba (si no existe) ---
    alumno_nombre = "Alumno Prueba"
    alumno_prueba = db.query(Alumno).filter(Alumno.id == ID_ALUMNO_PRUEBA).first()
    if not alumno_prueba:
        persona_existente = db.get(Persona, ID_ALUMNO_PRUEBA)
        if persona_existente and persona_existente.tipo != TipoPersona.ALUMNO:
             print(f"   - ERROR: Ya existe una Persona con ID {ID_ALUMNO_PRUEBA} pero no es Alumno.")
             return
        elif persona_existente:
             print(f"   - Persona Alumno con ID {ID_ALUMNO_PRUEBA} existe, verificando tabla 'alumno'...")
             alumno_prueba = persona_existente
             alumno_row = db.get(Alumno, ID_ALUMNO_PRUEBA)
             if not alumno_row:
                 print(f"   - ... creando entrada faltante en tabla 'alumno'...")
                 alumno_entry = Alumno(id=ID_ALUMNO_PRUEBA)
                 db.add(alumno_entry)
                 db.commit()
                 alumno_prueba = db.query(Alumno).filter(Alumno.id == ID_ALUMNO_PRUEBA).first()
             else:
                 alumno_prueba = alumno_row
        else:
            print(f"   - Creando alumno de prueba '{alumno_nombre}' con ID={ID_ALUMNO_PRUEBA}...")
            try:
                alumno_prueba = Alumno(id=ID_ALUMNO_PRUEBA, nombre=alumno_nombre)
                db.add(alumno_prueba)
                db.commit()
                db.refresh(alumno_prueba)
            except Exception as e:
                db.rollback()
                print(f"   - ERROR al crear alumno con ID forzado {ID_ALUMNO_PRUEBA}: {e}")
                print(f"   - Intentando crear alumno sin forzar ID...")
                alumno_prueba_nuevo = Alumno(nombre=alumno_nombre)
                db.add(alumno_prueba_nuevo)
                db.commit()
                db.refresh(alumno_prueba_nuevo)
                print(f"   - Alumno creado con ID asignado: {alumno_prueba_nuevo.id}. ¡DEBES ACTUALIZAR ID_ALUMNO_PRUEBA en seed_data.py y dependencies.py a {alumno_prueba_nuevo.id}!")
                alumno_prueba = alumno_prueba_nuevo

    if not alumno_prueba:
        print("   - ERROR CRÍTICO: No se pudo obtener/crear el alumno de prueba.")
        return

    print(f"   - Alumno de prueba (ID: {alumno_prueba.id}) listo.")


    # --- 5. Crear Cursadas (si no existen) ---
    cursadas_a_crear = [
        {"materia_nombre": "Álgebra Lineal (Simulación)"},
        {"materia_nombre": "Programación I (Simulación)"},
        {"materia_nombre": "Análisis Matemático I (Simulación)"}, # Nueva
        {"materia_nombre": "Física I (Simulación)"},              # Nueva
    ]
    cursadas_obj = {} # Diccionario para guardar objetos Cursada

    # Verifica que cuatri y profe existan antes del bucle
    if not cuatri or not profe:
        print("   - ERROR: Falta Cuatrimestre o Profesor base para crear cursadas.")
        return

    for curs_data in cursadas_a_crear:
        materia_obj = materias_obj.get(curs_data["materia_nombre"])
        if not materia_obj:
            print(f"   - ERROR: No se encontró la materia '{curs_data['materia_nombre']}' para crear su cursada.")
            continue # Salta a la siguiente

        # Busca la cursada existente
        cursada = db.query(Cursada).filter_by(
            materia_id=materia_obj.id,
            cuatrimestre_id=cuatri.id,
            profesor_id=profe.id # Asigna siempre al mismo profesor de prueba
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
        cursadas_obj[materia_obj.nombre] = cursada # Guarda el objeto cursada


    # Commit intermedio para asegurar IDs antes de crear Inscripciones
    db.commit()
    # Refrescar si es necesario
    for nombre, cursada_obj in cursadas_obj.items():
         if cursada_obj not in db:
             try:
                 db.refresh(cursada_obj)
             except Exception:
                  print(f"   - Aviso: No se pudo refrescar la cursada para '{nombre}'. Recargando...")
                  # Intenta recargarla por si acaso
                  materia_correspondiente = materias_obj.get(nombre)
                  if materia_correspondiente:
                      cursadas_obj[nombre] = db.query(Cursada).filter_by(
                          materia_id=materia_correspondiente.id,
                          cuatrimestre_id=cuatri.id,
                          profesor_id=profe.id
                      ).first()


    # --- 6. Inscribir Alumno de Prueba en Cursada 1 (si no está inscripto) ---
    cursada1 = cursadas_obj.get("Álgebra Lineal (Simulación)")
    if not cursada1 or not hasattr(cursada1, 'id'):
        print(f"   - ERROR: No se pudo obtener la Cursada 1 para la inscripción.")
    else:
        inscripcion = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada1.id).first()
        if not inscripcion:
            print(f"   - Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada1.id}...")
            nueva_inscripcion = Inscripcion(
                alumno_id=alumno_prueba.id,
                cursada_id=cursada1.id,
                ha_respondido=False
            )
            db.add(nueva_inscripcion)
        else:
            print(f"   - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada1.id}.")

    # --- (Opcional) Inscribir Alumno de Prueba en Cursada 3 (Análisis) ---
    # Para tener otra cursada donde el alumno esté inscripto
    cursada3 = cursadas_obj.get("Análisis Matemático I (Simulación)")
    if not cursada3 or not hasattr(cursada3, 'id'):
         print(f"   - Aviso: No se pudo obtener la Cursada 3 para inscripción opcional.")
    else:
        inscripcion3 = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada3.id).first()
        if not inscripcion3:
            print(f"   - (Opcional) Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada3.id}...")
            nueva_inscripcion3 = Inscripcion(
                alumno_id=alumno_prueba.id,
                cursada_id=cursada3.id,
                ha_respondido=False
            )
            db.add(nueva_inscripcion3)
        else:
             print(f"   - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada3.id}.")


    db.commit() # Commit final
    print("Datos semilla verificados/insertados.")


def create_tables():
     print("Creando tablas si no existen...")
     # Asegúrate que todos los modelos estén importados ANTES de llamar a create_all
     from src.materia import models
     from src.persona import models
     from src.encuestas import models
     from src.seccion import models
     from src.pregunta import models
     from src.respuesta import models
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de datos semilla...")
    # Descomenta si necesitas asegurarte que las tablas se creen/actualicen
    # create_tables()

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