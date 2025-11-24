import sys
import os
import random
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from src.database import SessionLocal
from src.encuestas.models import EncuestaInstancia, Encuesta
from src.respuesta.models import RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion
from src.pregunta.models import PreguntaMultipleChoice
from src.seccion.models import Seccion
from src.enumerados import TipoPregunta, EstadoInstancia

# --- AGREGAR ESTOS IMPORTS PARA QUE SQLALCHEMY RECONOZCA LAS RELACIONES ---
from src.materia.models import Cursada 
from src.instrumento.models import ActividadCurricularInstancia
from src.persona.models import Profesor, Alumno, Inscripcion

def seed_fix_respuestas(db: Session):
    print("🔧 Iniciando inyección retroactiva de respuestas de alumnos...")

    # 1. Buscar TODAS las encuestas CERRADAS que no tengan respuestas
    # (Asumimos que si están cerradas y son parte de un informe, deberían tener datos)
    encuestas_cerradas = db.query(EncuestaInstancia).filter(
        EncuestaInstancia.estado == EstadoInstancia.CERRADA
    ).options(
        selectinload(EncuestaInstancia.plantilla)
        .selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).all()

    print(f"   -> Se encontraron {len(encuestas_cerradas)} encuestas cerradas.")

    count_rellenadas = 0

    for instancia in encuestas_cerradas:
        # Verificar si ya tiene respuestas
        cant_respuestas = db.query(RespuestaSet).filter_by(instrumento_instancia_id=instancia.id).count()
        
        if cant_respuestas > 0:
            print(f"      (Saltando encuesta {instancia.id}: ya tiene {cant_respuestas} respuestas)")
            continue

        print(f"   + Generando datos para Encuesta {instancia.id} (Materia/Cursada {instancia.cursada_id})...")
        
        # Generar entre 15 y 30 respuestas por encuesta
        cantidad_alumnos_simulados = random.randint(15, 30)
        
        plantilla = instancia.plantilla
        if not plantilla: continue
        
        todas_preguntas = []
        for s in plantilla.secciones:
            todas_preguntas.extend(s.preguntas)

        for _ in range(cantidad_alumnos_simulados):
            rset = RespuestaSet(instrumento_instancia_id=instancia.id)
            
            for preg in todas_preguntas:
                # Responder solo Multiple Choice (que es lo que grafican los charts)
                if preg.tipo == TipoPregunta.MULTIPLE_CHOICE:
                    # Casteo para acceder a opciones
                    if hasattr(preg, 'opciones') and preg.opciones:
                        # Simulamos tendencia positiva (opciones con ID más alto suelen ser mejor puntaje o "Sí")
                        # Esto es solo para que el gráfico se vea bonito
                        opcion = random.choice(preg.opciones) 
                        
                        db.add(RespuestaMultipleChoice(
                            pregunta_id=preg.id,
                            opcion_id=opcion.id,
                            tipo=TipoPregunta.MULTIPLE_CHOICE,
                            respuesta_set=rset
                        ))
            
            db.add(rset)
        
        count_rellenadas += 1
    
    db.commit()
    print(f"\n✅ ¡Listo! Se inyectaron datos en {count_rellenadas} encuestas vacías.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_fix_respuestas(db)
    finally:
        db.close()