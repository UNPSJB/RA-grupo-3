from typing import List, Dict, Optional
from src.seccion.models import Seccion
from sqlalchemy import select, update, func, Any
import collections
from sqlalchemy.orm import Session, selectinload, joinedload
from src.encuestas import models, schemas
from src.exceptions import NotFound,BadRequest
from src.persona.models import Inscripcion # Necesitas Alumno e Inscripcion
from src.materia.models import Cursada,Cuatrimestre
from datetime import datetime
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.enumerados import EstadoInstancia, TipoPregunta,EstadoInstrumento
from src.respuesta.models import Respuesta, RespuestaMultipleChoice, RespuestaRedaccion, RespuestaSet


def crear_plantilla_encuesta(
    db: Session, 
    plantilla_data: schemas.EncuestaAlumnoPlantillaCreate
) -> models.Encuesta:
    db_plantilla = models.Encuesta(
        titulo=plantilla_data.titulo,
        descripcion=plantilla_data.descripcion
    )
    
    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    
    return db_plantilla

def listar_plantillas(db: Session, state: EstadoInstrumento = None) -> List[models.Encuesta]:
    stmt = select(models.Encuesta).options(selectinload(models.Encuesta.secciones))
    if state:
        stmt = stmt.filter(models.Encuesta.estado == state)
    return db.execute(stmt).unique().scalars().all()


def obtener_plantilla_por_id(db: Session, plantilla_id: int) -> models.Encuesta:
    plantilla = db.query(models.Encuesta).options(selectinload(models.Encuesta.secciones)).filter(models.Encuesta.id == plantilla_id).first()
    if not plantilla:
        raise NotFound(detail= f"Plantilla de Encuesta con id {plantilla_id} no encontrada")
    return plantilla

def modificar_plantilla(
    db: Session, plantilla_id: int, plantilla_data: schemas.EncuestaAlumnoPlantillaUpdate
) -> models.Encuesta:
    db_plantilla = obtener_plantilla_por_id(db, plantilla_id)
    if db_plantilla.estado == EstadoInstrumento.PUBLICADA:
        raise ValueError("No se puede modificar una plantilla de encuesta publicada")

    update_data = plantilla_data.model_dump(exclude_unset=True)
    if update_data:
        db.execute(
            update(models.Encuesta).where(models.Encuesta.id == plantilla_id).values(**update_data)
        )
        db.commit()
        db.refresh(db_plantilla)
    return db_plantilla

def actualizar_estado_plantilla(db: Session, plantilla_id: int, nuevo_estado: EstadoInstrumento) -> models.Encuesta:
    plantilla_db = obtener_plantilla_por_id(db, plantilla_id)
    plantilla_db.estado = nuevo_estado
    db.add(plantilla_db)
    db.commit()
    db.refresh(plantilla_db)
    return plantilla_db

def eliminar_plantilla(db: Session, plantilla_id: int) -> models.Encuesta:
    db_plantilla = obtener_plantilla_por_id(db, plantilla_id)
    db.delete(db_plantilla)
    db.commit()
    return db_plantilla

#EncuestaInstancia

def activar_encuesta_para_cursada(db: Session, data: schemas.EncuestaInstanciaCreate) -> models.EncuestaInstancia:
    cursada = db.get(Cursada, data.cursada_id)
    if not cursada:
        raise NotFound(detail=f"Cursada con ID {data.cursada_id} no encontrada.")
    plantilla = db.get(models.Encuesta, data.plantilla_id)
    if not plantilla:
        raise NotFound(detail=f"Plantilla de Encuesta con ID {data.plantilla_id} no encontrada.")
    if plantilla.estado != EstadoInstrumento.PUBLICADA:
        raise BadRequest(detail=f"La plantilla de encuesta {data.plantilla_id} no está publicada.")

    stmt_existente = select(models.EncuestaInstancia).where(models.EncuestaInstancia.cursada_id == data.cursada_id)
    instancia_existente = db.execute(stmt_existente).scalar_one_or_none()
    if instancia_existente:
        raise BadRequest(detail=f"Ya existe una instancia de encuesta (ID: {instancia_existente.id}) para la cursada {data.cursada_id}.")
    nueva_instancia = models.EncuestaInstancia(
        cursada_id=data.cursada_id,
        plantilla_id=data.plantilla_id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado=data.estado 
    )
    db.add(nueva_instancia)
    try:
        db.commit()
        db.refresh(nueva_instancia)
    except Exception as e:
        db.rollback()
        print(f"ERROR en commit al activar instancia: {e}")
        raise BadRequest(detail=f"Error al guardar la instancia en la base de datos: {e}")

    return nueva_instancia


def obtener_instancias_activas_alumno(db: Session, alumno_id: int) -> List[models.EncuestaInstancia]:
    now = datetime.now() 
    stmt = (
        select(models.EncuestaInstancia)
        .join(Inscripcion,models.EncuestaInstancia.cursada_id == Inscripcion.cursada_id) 
        .where(
            Inscripcion.alumno_id == alumno_id,
           models.EncuestaInstancia.estado ==models.EstadoInstancia.ACTIVA,
        )
        .options(
            joinedload(models.EncuestaInstancia.plantilla),
            joinedload(models.EncuestaInstancia.cursada) 
            .joinedload(Cursada.materia)
        )
        .distinct() 
    )

    instancias_activas = db.execute(stmt).scalars().all()
    return instancias_activas


def obtener_instancia_activa_por_cursada(db: Session, cursada_id: int) -> models.EncuestaInstancia:
    now = datetime.now()
    stmt = (
        select(models.EncuestaInstancia)
        .where(
            models.EncuestaInstancia.cursada_id == cursada_id,
            models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA,
            models.EncuestaInstancia.fecha_inicio <= now,
            (models.EncuestaInstancia.fecha_fin == None) | (models.EncuestaInstancia.fecha_fin > now)
        )
        .options(selectinload(models.EncuestaInstancia.plantilla))
    )
    instancia = db.execute(stmt).scalar_one_or_none()
    if not instancia:
        raise NotFound(f"No se encontró una encuesta activa para la cursada ID {cursada_id}.")
    return instancia

def obtener_plantilla_para_instancia_activa(db: Session, instancia_id: int) -> models.Encuesta:
    now = datetime.now()
    instancia = db.query(models.EncuestaInstancia)\
        .filter(
            models.EncuestaInstancia.id == instancia_id,
            models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA,
        )\
        .options(
            selectinload(models.EncuestaInstancia.plantilla)
            .selectinload(models.Encuesta.secciones)
            .selectinload(Seccion.preguntas)
        )\
        .first()
    if not instancia:
        raise NotFound(detail=f"No se encontró una encuesta activa con ID de instancia {instancia_id}.")

    if not instancia.plantilla:
         raise Exception(f"La instancia {instancia_id} no tiene una plantilla asociada.")

    return instancia.plantilla

#Para el profesor
#Para mas adelante...
def obtener_resultados_agregados_profesor(
    db: Session,
    profesor_id: int,
    cuatrimestre_id: Optional[int] = None
) -> List[schemas.ResultadoCursada]:

    stmt_cursadas = (
        select(Cursada)
        .options(
            joinedload(Cursada.materia), 
            joinedload(Cursada.cuatrimestre), 
            selectinload(Cursada.encuesta_instancia)
            .selectinload(models.EncuestaInstancia.plantilla)
            .selectinload(models.Encuesta.secciones)
            .selectinload(Seccion.preguntas)
            .selectinload(Pregunta.opciones.of_type(PreguntaMultipleChoice)) # Carga Opciones solo para MC
        )
        .where(Cursada.profesor_id == profesor_id)
    )
    if cuatrimestre_id:
        cuatri = db.get(Cuatrimestre, cuatrimestre_id)
        if not cuatri:
             raise NotFound(detail=f"Cuatrimestre con ID {cuatrimestre_id} no encontrado.")
        stmt_cursadas = stmt_cursadas.where(Cursada.cuatrimestre_id == cuatrimestre_id)

    cursadas_profesor = db.execute(stmt_cursadas).scalars().unique().all()

    resultados_finales: List[schemas.ResultadoCursada] = []


    for cursada in cursadas_profesor:
        instancia = cursada.encuesta_instancia

        if not instancia or instancia.estado != EstadoInstancia.CERRADA:
            continue

        plantilla = instancia.plantilla
        if not plantilla or not plantilla.secciones:
            continue 

        stmt_respuestas = (
            select(Respuesta)
            .join(RespuestaSet)
            .where(RespuestaSet.encuesta_instancia_id == instancia.id)
            .options(
                selectinload(RespuestaMultipleChoice.opcion), 
                selectinload(Respuesta.pregunta) 
            )
        )
        todas_las_respuestas = db.execute(stmt_respuestas).scalars().all()

        cantidad_sets = db.query(func.count(RespuestaSet.id)).filter(RespuestaSet.encuesta_instancia_id == instancia.id).scalar() or 0
        if cantidad_sets == 0 and not todas_las_respuestas: 
             continue

        resultados_por_pregunta_dict: Dict[int, Dict[str, Any]] = collections.defaultdict(lambda: {"opciones": collections.defaultdict(int), "textos": []})

        for respuesta in todas_las_respuestas:
            pid = respuesta.pregunta_id
            if isinstance(respuesta, RespuestaMultipleChoice):
                if respuesta.opcion_id is not None:
                    resultados_por_pregunta_dict[pid]["opciones"][respuesta.opcion_id] += 1
            elif isinstance(respuesta, RespuestaRedaccion):
                 if respuesta.texto is not None: 
                     resultados_por_pregunta_dict[pid]["textos"].append(schemas.RespuestaTextoItem(texto=respuesta.texto))

        resultados_preguntas_schema: List[schemas.ResultadoPregunta] = []
        for seccion in plantilla.secciones:
            for pregunta in seccion.preguntas:
                resultados_opciones_schema: List[schemas.ResultadoOpcion] = []
                respuestas_texto_schema: List[schemas.RespuestaTextoItem] = []

                pregunta_resultados = resultados_por_pregunta_dict.get(pregunta.id)

                if isinstance(pregunta, PreguntaMultipleChoice):
                    for opcion in pregunta.opciones:
                         cantidad = pregunta_resultados["opciones"].get(opcion.id, 0) if pregunta_resultados else 0
                         resultados_opciones_schema.append(
                             schemas.ResultadoOpcion(
                                 opcion_id=opcion.id,
                                 opcion_texto=opcion.texto,
                                 cantidad=cantidad
                             )
                         )
                    resultados_preguntas_schema.append(
                        schemas.ResultadoPregunta(
                            pregunta_id=pregunta.id,
                            pregunta_texto=pregunta.texto,
                            pregunta_tipo=pregunta.tipo,
                            resultados_opciones=resultados_opciones_schema,
                            respuestas_texto=None 
                        )
                    )
                elif pregunta.tipo == TipoPregunta.REDACCION:
                    respuestas_texto_schema = pregunta_resultados["textos"] if pregunta_resultados else []
                    resultados_preguntas_schema.append(
                        schemas.ResultadoPregunta(
                            pregunta_id=pregunta.id,
                            pregunta_texto=pregunta.texto,
                            pregunta_tipo=pregunta.tipo,
                            resultados_opciones=None, 
                            respuestas_texto=respuestas_texto_schema
                        )
                    )
        cuatri_info = "N/A"
        if cursada.cuatrimestre:
             periodo_val = cursada.cuatrimestre.periodo.value if cursada.cuatrimestre.periodo else '?'
             cuatri_info = f"{cursada.cuatrimestre.anio} - {periodo_val}"
        resultados_finales.append(
            schemas.ResultadoCursada(
                cursada_id=cursada.id,
                materia_nombre=cursada.materia.nombre if cursada.materia else "N/A",
                cuatrimestre_info=cuatri_info,
                cantidad_respuestas=cantidad_sets,
                resultados_por_pregunta=resultados_preguntas_schema
            )
        )

    return resultados_finales


def listar_instancias_cerradas_profesor(
    db: Session,
    profesor_id: int,
    cuatrimestre_id: Optional[int] = None
) -> List[models.EncuestaInstancia]:
    stmt = (
        select(models.EncuestaInstancia)
        .join(Cursada, models.EncuestaInstancia.cursada_id == Cursada.id) 
        .where(
            Cursada.profesor_id == profesor_id, 
            models.EncuestaInstancia.estado == EstadoInstancia.CERRADA 
        )
        .options(
            joinedload(models.EncuestaInstancia.plantilla), 
            joinedload(models.EncuestaInstancia.cursada).joinedload(Cursada.materia)
        )
        .order_by(models.EncuestaInstancia.fecha_fin.desc()) 
    )

    if cuatrimestre_id:
        stmt = stmt.where(Cursada.cuatrimestre_id == cuatrimestre_id)

    instancias_cerradas = db.execute(stmt).scalars().unique().all()
    return instancias_cerradas

def cerrar_instancia_encuesta(db: Session, instancia_id: int) -> models.EncuestaInstancia:

    instancia = db.get(models.EncuestaInstancia, instancia_id)
    if not instancia:
        raise NotFound(detail=f"EncuestaInstancia con ID {instancia_id} no encontrada.")
    if instancia.estado != models.EstadoInstancia.ACTIVA:
        raise BadRequest(detail=f"La instancia {instancia_id} no está ACTIVA, no se puede cerrar.")
    if instancia.estado == models.EstadoInstancia.CERRADA:
         print(f"Instancia {instancia_id} ya estaba cerrada.")
         return instancia 

    instancia.estado = models.EstadoInstancia.CERRADA
    if instancia.fecha_fin is None:
        instancia.fecha_fin = datetime.now() 

    db.add(instancia)
    try:
        db.commit()
        db.refresh(instancia)
    except Exception as e:
        db.rollback()
        print(f"ERROR en commit al cerrar instancia {instancia_id}: {e}")
        raise BadRequest(detail=f"Error al guardar el cambio de estado: {e}")

    return instancia