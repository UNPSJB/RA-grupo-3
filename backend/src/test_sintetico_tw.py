import sys
import os
import random
from datetime import datetime
from sqlalchemy.orm import Session, configure_mappers
from sqlalchemy import select

# Ajustar path para que encuentre el paquete 'src'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.database import SessionLocal

# 1. CARGA DE MODELOS MASIVA (Para asegurar que SQLAlchemy los registre)
from src.models import ModeloBase
from src.materia import models as materia_models
from src.persona import models as persona_models
from src.encuestas import models as encuestas_models
from src.seccion import models as seccion_models
from src.pregunta import models as pregunta_models
from src.respuesta import models as respuesta_models
from src.instrumento import models as instrumento_models

configure_mappers()

# 2. IMPORTS ESPECÍFICOS
from src.materia.models import Cursada, Materia, Carrera, Departamento
from src.instrumento.models import ActividadCurricularInstancia, ActividadCurricular, InformeSintetico, InformeSinteticoInstancia
from src.encuestas.models import EncuestaInstancia, Encuesta, PeriodoEvaluacion
from src.respuesta.models import RespuestaSet, RespuestaRedaccion
from src.enumerados import EstadoInforme, EstadoInstancia, EstadoInstrumento, TipoInstrumento, TipoPregunta

def seed_step3_depto(db: Session):
    print("🏢 [PASO 3] Preparando Informe Sintético (Trelew) CON SECCIÓN 0...")

    # Buscar Depto Trelew
    depto = db.scalar(select(Departamento).where(Departamento.nombre.ilike("%(TW)%")))
    if not depto:
        print("❌ No se encontró el departamento de Trelew (TW). Ejecuta seed_data primero.")
        return

    # Buscar Plantillas
    plantilla_enc = db.scalar(select(Encuesta).where(Encuesta.tipo == TipoInstrumento.ENCUESTA))
    plantilla_inf = db.scalar(select(ActividadCurricular).where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR))
    plantilla_sin = db.scalar(select(InformeSintetico).where(InformeSintetico.tipo == TipoInstrumento.INFORME_SINTETICO))

    # Seleccionar 5 materias para el ejemplo
    cursadas = db.scalars(
        select(Cursada).join(Materia).join(Materia.carreras)
        .where(Carrera.departamento_id == depto.id).limit(5).offset(5)
    ).unique().all()

    if not cursadas: # Fallback si hay pocas materias
        cursadas = db.scalars(select(Cursada).join(Materia).join(Materia.carreras).where(Carrera.departamento_id == depto.id).limit(5)).unique().all()

    # Asegurar Periodo
    periodo = db.scalar(select(PeriodoEvaluacion).where(PeriodoEvaluacion.nombre == "Ciclo Cerrado (Demo)"))
    if not periodo:
        periodo = PeriodoEvaluacion(nombre="Ciclo Cerrado (Demo)", fecha_inicio_encuesta=datetime.now(), fecha_fin_encuesta=datetime.now())
        db.add(periodo)
        db.commit()

    # A. Crear Informe Sintético PENDIENTE (o usar existente)
    sintetico = db.scalar(select(InformeSinteticoInstancia).where(
        InformeSinteticoInstancia.departamento_id == depto.id,
        InformeSinteticoInstancia.estado == EstadoInforme.PENDIENTE
    ))

    if not sintetico:
        sintetico = InformeSinteticoInstancia(
            informe_sintetico_id=plantilla_sin.id, departamento_id=depto.id,
            tipo=TipoInstrumento.INFORME_SINTETICO,
            fecha_inicio=datetime.now(), fecha_fin=datetime.now(),
            estado=EstadoInforme.PENDIENTE
        )
        db.add(sintetico)
        db.commit() 
    
    print(f"   -> Informe Sintético ID {sintetico.id} preparado.")

    # Obtener todas las preguntas de la plantilla de INFORME CURRICULAR
    preguntas_inf = [p for s in plantilla_inf.secciones for p in s.preguntas]

    # B. Generar informes COMPLETADOS de estas materias
    for cursada in cursadas:
        print(f"      > Procesando {cursada.materia.nombre}...")

        # 1. Encuesta (Cerrada)
        enc = db.scalar(select(EncuestaInstancia).where(EncuestaInstancia.cursada_id == cursada.id))
        if not enc:
            enc = EncuestaInstancia(
                cursada_id=cursada.id, plantilla_id=plantilla_enc.id, periodo_evaluacion_id=periodo.id,
                estado=EstadoInstancia.CERRADA
            )
            db.add(enc)
            db.flush()

        # 2. Informe de Cátedra (Vinculado al sintético)
        inf = db.scalar(select(ActividadCurricularInstancia).where(ActividadCurricularInstancia.cursada_id == cursada.id))
        if not inf:
            inf = ActividadCurricularInstancia(
                actividad_curricular_id=plantilla_inf.id, cursada_id=cursada.id,
                encuesta_instancia_id=enc.id, profesor_id=cursada.profesor_id,
                estado=EstadoInforme.RESUMIDO, 
                informe_sintetico_instancia_id=sintetico.id,
                tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR
            )
            db.add(inf)
        else:
            inf.estado = EstadoInforme.RESUMIDO
            inf.informe_sintetico_instancia_id = sintetico.id
            db.add(inf)
        
        db.flush()

        # 3. Rellenar Respuestas (Limpiar anteriores primero)
        db.query(RespuestaSet).filter(RespuestaSet.instrumento_instancia_id == inf.id).delete()
        rset = RespuestaSet(instrumento_instancia_id=inf.id)
        db.add(rset)
        db.flush()

        # --- DATOS CORREGIDOS INCLUYENDO SECCIÓN 0 ---
        datos = {
            "alumnos": str(random.randint(20, 80)),  # Sección 0
            "teoricas": "1",                         # Sección 0
            "practicas": "2",                        # Sección 0
            "equipamiento": "Solicito 2 PCs i7.", 
            "bibliografia": "Clean Architecture (Martin).",
            "dictadas": "95%", 
            "contenido": "100%", 
            "estrategias": "Clases grabadas.",
            "juicio": "Resultados positivos.", 
            "obstaculos": "Falta de espacio."
        }

        for p in preguntas_inf:
            t = p.texto.lower()
            val = ""
            
            # --- Lógica de coincidencia mejorada ---
            # Sección 0
            if "alumnos" in t or "inscriptos" in t: val = datos["alumnos"]
            elif "teóricas" in t and "comisiones" in t: val = datos["teoricas"]
            elif "prácticas" in t and "comisiones" in t: val = datos["practicas"]
            
            # Resto de secciones
            elif "equipamiento" in t: val = datos["equipamiento"]
            elif "bibliografía" in t or "bibliografia" in t: val = datos["bibliografia"]
            elif "dictadas" in t: val = datos["dictadas"]
            elif "contenido" in t: val = datos["contenido"]
            elif "estrategias" in t: val = datos["estrategias"]
            elif "juicio" in t or "valor" in t: val = datos["juicio"]
            elif "obstáculos" in t or "obstaculos" in t: val = datos["obstaculos"]
            
            if val:
                db.add(RespuestaRedaccion(pregunta_id=p.id, respuesta_set_id=rset.id, tipo=TipoPregunta.REDACCION, texto=val))

    db.commit()
    print("✅ Listo. Ahora sí, el Informe Sintético tiene datos en la Sección 0.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_step3_depto(db)
    db.close()