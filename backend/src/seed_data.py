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
    Crea: 1 Cuatrimestre, 2 Materias, 1 Profesor, 1 Alumno, 2 Cursadas, 1 Inscripcion.
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
    materia1_nombre = "Álgebra Lineal (Simulación)"
    materia1 = db.query(Materia).filter_by(nombre=materia1_nombre).first()
    if not materia1:
        print(f"   - Creando materia '{materia1_nombre}'...")
        materia1 = Materia(nombre=materia1_nombre, descripcion="Materia de prueba para encuestas")
        db.add(materia1)
    else:
        print(f"   - Materia '{materia1_nombre}' (ID: {materia1.id}) ya existe.")

    materia2_nombre = "Programación I (Simulación)"
    materia2 = db.query(Materia).filter_by(nombre=materia2_nombre).first()
    if not materia2:
        print(f"   - Creando materia '{materia2_nombre}'...")
        materia2 = Materia(nombre=materia2_nombre, descripcion="Otra materia de prueba")
        db.add(materia2)
    else:
        print(f"   - Materia '{materia2_nombre}' (ID: {materia2.id}) ya existe.")

    # Commit intermedio para asegurar IDs antes de crear Cursadas
    db.commit()
    # Refrescar si se crearon
    # Corrección: Verificar si el objeto ya está en la sesión antes de refrescar
    if materia1 not in db.new: db.refresh(materia1) # Usar db.new para verificar si es nuevo
    if materia2 not in db.new: db.refresh(materia2) # Usar db.new para verificar si es nuevo


    # --- 3. Crear Profesor (si no existe) ---
    profe_nombre = "Profesor Simulado"
    # --- CORRECCIÓN AQUÍ ---
    # Busca directamente en Profesor y filtra por el atributo 'nombre' (heredado)
    profe = db.query(Profesor).filter(Profesor.nombre == profe_nombre).first()
    # --- FIN CORRECCIÓN ---
    if not profe:
        print(f"   - Creando profesor '{profe_nombre}'...")
        # Crea directamente Profesor, SQLAlchemy maneja Persona
        profe = Profesor(nombre=profe_nombre)
        db.add(profe)
        db.commit()
        db.refresh(profe)
    else:
         print(f"   - Profesor '{profe_nombre}' (ID: {profe.id}) ya existe.")


    # --- 4. Crear Alumno de Prueba (si no existe) ---
    alumno_nombre = "Alumno Prueba"
    # Busca directamente en Alumno por el ID fijo
    alumno_prueba = db.query(Alumno).filter(Alumno.id == ID_ALUMNO_PRUEBA).first()
    if not alumno_prueba:
        # Intenta buscar la persona por ID por si existe pero no como alumno
        persona_existente = db.get(Persona, ID_ALUMNO_PRUEBA)
        if persona_existente and persona_existente.tipo != TipoPersona.ALUMNO:
             print(f"   - ERROR: Ya existe una Persona con ID {ID_ALUMNO_PRUEBA} pero no es Alumno.")
             return # Salir si hay conflicto de tipo
        elif persona_existente:
             # Si la Persona existe y es Alumno, crea solo el registro Alumno si falta
             print(f"   - Persona Alumno con ID {ID_ALUMNO_PRUEBA} existe, verificando tabla 'alumno'...")
             alumno_prueba = persona_existente # Asumiendo que es instancia de Alumno
             # Verifica si el registro específico 'alumno' falta
             alumno_row = db.get(Alumno, ID_ALUMNO_PRUEBA) # Intenta obtener Alumno directamente
             if not alumno_row:
                 print(f"   - ... creando entrada faltante en tabla 'alumno'...")
                 # Crea solo la entrada en la tabla hija si falta
                 # No deberías necesitar asignar nombre aquí si la persona ya existe
                 alumno_entry = Alumno(id=ID_ALUMNO_PRUEBA)
                 db.add(alumno_entry)
                 db.commit() # Comete solo la creación de la fila hija
                 # Vuelve a obtener el objeto completo
                 alumno_prueba = db.query(Alumno).filter(Alumno.id == ID_ALUMNO_PRUEBA).first()
             else:
                 alumno_prueba = alumno_row # Ya existía el registro Alumno
        else:
            # Si no existe ni Persona, crea todo
            print(f"   - Creando alumno de prueba '{alumno_nombre}' con ID={ID_ALUMNO_PRUEBA}...")
            # Crea Alumno directamente.
            # ¡OJO con forzar ID! Asegúrate que esté libre.
            try:
                # Intenta crear con el ID forzado
                alumno_prueba = Alumno(id=ID_ALUMNO_PRUEBA, nombre=alumno_nombre)
                db.add(alumno_prueba)
                db.commit()
                db.refresh(alumno_prueba)
            except Exception as e: # Captura error si el ID ya existe
                db.rollback()
                print(f"   - ERROR al crear alumno con ID forzado {ID_ALUMNO_PRUEBA}: {e}")
                print(f"   - Intentando crear alumno sin forzar ID...")
                # Intenta crear sin forzar el ID (la BD asignará uno nuevo)
                alumno_prueba_nuevo = Alumno(nombre=alumno_nombre)
                db.add(alumno_prueba_nuevo)
                db.commit()
                db.refresh(alumno_prueba_nuevo)
                print(f"   - Alumno creado con ID asignado: {alumno_prueba_nuevo.id}. ¡DEBES ACTUALIZAR ID_ALUMNO_PRUEBA en seed_data.py y dependencies.py a {alumno_prueba_nuevo.id}!")
                # Asigna el nuevo objeto para continuar el script, pero advierte al usuario
                alumno_prueba = alumno_prueba_nuevo
                # return # Podrías detener el script aquí para forzar la actualización del ID

    # Asegurarse que alumno_prueba no sea None antes de continuar
    if not alumno_prueba:
        print("   - ERROR CRÍTICO: No se pudo obtener/crear el alumno de prueba.")
        return

    print(f"   - Alumno de prueba (ID: {alumno_prueba.id}) listo.")


    # --- 5. Crear Cursadas (si no existen) ---
    # Asegúrate que las materias y cuatri existen antes de usarlos
    if not materia1 or not cuatri or not profe:
        print("   - ERROR: Falta Materia 1, Cuatrimestre o Profesor para crear Cursada 1.")
        return
    cursada1 = db.query(Cursada).filter_by(materia_id=materia1.id, cuatrimestre_id=cuatri.id).first()
    if not cursada1:
        print(f"   - Creando cursada para '{materia1.nombre}'...")
        cursada1 = Cursada(
            materia_id=materia1.id,
            cuatrimestre_id=cuatri.id,
            profesor_id=profe.id # Vincula con el Profesor
        )
        db.add(cursada1)
    else:
        print(f"   - Cursada para '{materia1.nombre}' (ID: {cursada1.id}) ya existe.")

    if not materia2 or not cuatri or not profe:
         print("   - ERROR: Falta Materia 2, Cuatrimestre o Profesor para crear Cursada 2.")
         return
    cursada2 = db.query(Cursada).filter_by(materia_id=materia2.id, cuatrimestre_id=cuatri.id).first()
    if not cursada2:
        print(f"   - Creando cursada para '{materia2.nombre}'...")
        cursada2 = Cursada(
            materia_id=materia2.id,
            cuatrimestre_id=cuatri.id,
            profesor_id=profe.id # Vincula con el Profesor
        )
        db.add(cursada2)
    else:
        print(f"   - Cursada para '{materia2.nombre}' (ID: {cursada2.id}) ya existe.")

    # Commit intermedio para asegurar IDs antes de crear Inscripciones
    db.commit()
    # Refrescar si se crearon
    if cursada1 not in db.new: db.refresh(cursada1)
    if cursada2 not in db.new: db.refresh(cursada2)

    # Asegúrate que cursada1 tiene ID antes de inscribir
    if not cursada1 or not hasattr(cursada1, 'id'):
        print(f"   - ERROR: No se pudo obtener el ID de Cursada 1 para la inscripción.")
        return

    # --- 6. Inscribir Alumno de Prueba en Cursada 1 (si no está inscripto) ---
    inscripcion = db.query(Inscripcion).filter_by(alumno_id=alumno_prueba.id, cursada_id=cursada1.id).first()
    if not inscripcion:
        print(f"   - Inscribiendo Alumno ID {alumno_prueba.id} en Cursada ID {cursada1.id}...")
        nueva_inscripcion = Inscripcion(
            alumno_id=alumno_prueba.id,
            cursada_id=cursada1.id,
            ha_respondido=False # Importante: empieza como False
        )
        db.add(nueva_inscripcion)
    else:
        print(f"   - Alumno ID {alumno_prueba.id} ya inscripto en Cursada ID {cursada1.id}.")

    db.commit() # Commit final
    print("Datos semilla verificados/insertados.")


def create_tables():
     print("Creando tablas si no existen...")
     # Asegúrate que todos los modelos estén importados ANTES de llamar a create_all
     # A veces es necesario importar explícitamente todos los módulos de modelos
     # from src.materia import models
     # from src.persona import models
     # from src.encuestas import models
     # ... etc ...
     ModeloBase.metadata.create_all(bind=engine)
     print("Tablas verificadas/creadas.")


# --- Punto de entrada para ejecutar el script ---
if __name__ == "__main__":
    print("Iniciando script de carga de datos semilla...")
    # Opcional: Crear tablas si no existen la primera vez
    # Descomenta si necesitas asegurarte que las tablas se creen/actualicen
    # create_tables()

    # Obtener una sesión de base de datos
    db = SessionLocal()
    try:
        # Ejecutar la función de carga
        seed_initial_data(db)
        print("Script finalizado exitosamente.")
    except Exception as e:
        print(f"ERROR durante la carga de datos semilla: {e}")
        import traceback
        traceback.print_exc() # Imprime el traceback completo del error
        db.rollback() # Deshace cambios en caso de error
    finally:
        db.close() # Siempre cierra la sesión

