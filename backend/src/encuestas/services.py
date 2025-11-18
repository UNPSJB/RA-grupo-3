from typing import List, Dict, Optional, Any
from src.seccion.models import Seccion
from sqlalchemy import select, update, func, Any
import collections
from sqlalchemy.orm import Session, selectinload, joinedload
from src.encuestas import models, schemas
from src.exceptions import NotFound,BadRequest
from src.persona.models import Inscripcion, Profesor
from src.materia.models import Cursada, Cuatrimestre, Materia, Carrera
from datetime import datetime
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.enumerados import EstadoInstancia, TipoPregunta,EstadoInstrumento, EstadoInforme, TipoInstrumento
from src.respuesta.models import Respuesta, RespuestaMultipleChoice, RespuestaRedaccion, RespuestaSet
from src.instrumento import models as instrumento_models


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


def obtener_instancias_activas_alumno(db: Session, alumno_id: int) -> List[Dict[str, Any]]:
    now = datetime.now() 
    
    stmt = (
        select(models.EncuestaInstancia, Inscripcion.ha_respondido)
        .join(Inscripcion,models.EncuestaInstancia.cursada_id == Inscripcion.cursada_id) 
        .where(
            Inscripcion.alumno_id == alumno_id,
            models.EncuestaInstancia.estado == models.EstadoInstancia.ACTIVA,
        )
        .options(
            joinedload(models.EncuestaInstancia.plantilla),
            joinedload(models.EncuestaInstancia.cursada) 
            .joinedload(Cursada.materia),
            joinedload(models.EncuestaInstancia.cursada)
            .joinedload(Cursada.profesor)
        )
        .distinct() 
    )

    results = db.execute(stmt).all()

    response_list = []
    for instancia, ha_respondido_flag in results:
        plantilla_data = schemas.PlantillaInfo.model_validate(instancia.plantilla).model_dump()
        response_list.append({
            "instancia_id": instancia.id,
            "plantilla": plantilla_data, 
            "materia_nombre": instancia.cursada.materia.nombre if instancia.cursada and instancia.cursada.materia else None,
            "profesor_nombre": instancia.cursada.profesor.nombre if instancia.cursada and instancia.cursada.profesor else None,
            "fecha_fin": instancia.fecha_fin,
            "ha_respondido": ha_respondido_flag 
        })
        
    return response_list

def obtener_instancias_activas_profesor(db: Session, profesor_id: int) -> List[Dict[str, Any]]:
 
    
    stmt = (
        select(instrumento_models.ActividadCurricularInstancia)
        .join(Cursada, instrumento_models.ActividadCurricularInstancia.cursada_id == Cursada.id)
        .where(
            instrumento_models.ActividadCurricularInstancia.profesor_id == profesor_id,
            instrumento_models.ActividadCurricularInstancia.estado == EstadoInforme.PENDIENTE 
        )
        .options(
            joinedload(instrumento_models.ActividadCurricularInstancia.actividad_curricular),
            joinedload(instrumento_models.ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.materia),
            joinedload(instrumento_models.ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.profesor)
        )
        .distinct()
    )

    results = db.execute(stmt).scalars().all()

    response_list = []
    for instancia in results:
        
        if not instancia.actividad_curricular:
            continue
            
        plantilla_data = schemas.PlantillaInfo.model_validate(instancia.actividad_curricular).model_dump()
        
        ha_respondido = instancia.estado != EstadoInforme.PENDIENTE

        response_list.append({
            "instancia_id": instancia.id,
            "plantilla": plantilla_data, 
            "materia_nombre": instancia.cursada.materia.nombre if instancia.cursada and instancia.cursada.materia else None,
            "profesor_nombre": instancia.cursada.profesor.nombre if instancia.cursada and instancia.cursada.profesor else None,
            "fecha_fin": instancia.fecha_fin,
            "ha_respondido": ha_respondido
        })
        
    return response_list

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
        raise NotFound(detail=f"No se encontró una encuesta activa para la cursada ID {cursada_id}.") #modificado para aclararle a la excepción que le paso un string al campo detail
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
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones)

        )\
        .first()
    if not instancia:
        raise NotFound(detail=f"No se encontró una encuesta activa con ID de instancia {instancia_id}.")

    if not instancia:
         raise Exception(f"La instancia {instancia_id} no tiene una plantilla asociada.")

    return instancia.plantilla

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
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones),
            

            selectinload(Cursada.actividad_curricular_instancia) 
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
            .where(RespuestaSet.instrumento_instancia_id == instancia.id) 
            .options(
                selectinload(RespuestaMultipleChoice.opcion), 
                selectinload(Respuesta.pregunta) 
            )
        )
        todas_las_respuestas = db.execute(stmt_respuestas).scalars().all()

        cantidad_sets = db.query(func.count(RespuestaSet.id)).filter(RespuestaSet.instrumento_instancia_id == instancia.id).scalar() or 0
        

        if cantidad_sets == 0 and not todas_las_respuestas: 
             continue

        resultados_por_pregunta_dict: Dict[int, Dict[str, Any]] = collections.defaultdict(lambda: {"opciones": collections.defaultdict(int), "textos": []})

        for respuesta in todas_las_respuestas:
            pid = respuesta.pregunta_id
            if isinstance(respuesta, RespuestaMultipleChoice):
                if respuesta.opcion_id is not None:

                    if respuesta.opcion:
                        resultados_por_pregunta_dict[pid]["opciones"][respuesta.opcion_id] += 1
            elif isinstance(respuesta, RespuestaRedaccion):
                 if respuesta.texto is not None: 
                     resultados_por_pregunta_dict[pid]["textos"].append(schemas.RespuestaTextoItem(texto=respuesta.texto))

        

        resultados_secciones_schema: List[schemas.ResultadoSeccion] = [] 

        for seccion in plantilla.secciones:
            if not seccion.preguntas: continue
            
            preguntas_de_esta_seccion: List[schemas.ResultadoPregunta] = []

            for pregunta in seccion.preguntas:
                resultados_opciones_schema: List[schemas.ResultadoOpcion] = []
                respuestas_texto_schema: List[schemas.RespuestaTextoItem] = []

                pregunta_resultados = resultados_por_pregunta_dict.get(pregunta.id)

                if isinstance(pregunta, PreguntaMultipleChoice):
                    if not pregunta.opciones: continue 
                    for opcion in pregunta.opciones:
                         cantidad = pregunta_resultados["opciones"].get(opcion.id, 0) if pregunta_resultados else 0
                         resultados_opciones_schema.append(
                             schemas.ResultadoOpcion(
                                 opcion_id=opcion.id,
                                 opcion_texto=opcion.texto,
                                 cantidad=cantidad
                             )
                         )
                    
                    preguntas_de_esta_seccion.append(
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
                    
                    preguntas_de_esta_seccion.append(
                        schemas.ResultadoPregunta(
                            pregunta_id=pregunta.id,
                            pregunta_texto=pregunta.texto,
                            pregunta_tipo=pregunta.tipo,
                            resultados_opciones=None, 
                            respuestas_texto=respuestas_texto_schema
                        )
                    )
            
            if preguntas_de_esta_seccion:
                resultados_secciones_schema.append(
                    schemas.ResultadoSeccion(
                        seccion_nombre=seccion.nombre,
                        resultados_por_pregunta=preguntas_de_esta_seccion
                    )
                )

        cuatri_info = "N/A"
        if cursada.cuatrimestre:
             periodo_val = cursada.cuatrimestre.periodo.value if cursada.cuatrimestre.periodo else '?'
             cuatri_info = f"{cursada.cuatrimestre.anio} - {periodo_val}"
        
        informe_id = None
        if (cursada.actividad_curricular_instancia and 
            cursada.actividad_curricular_instancia.estado == EstadoInforme.PENDIENTE):
            informe_id = cursada.actividad_curricular_instancia.id
        
        resultados_finales.append(
            schemas.ResultadoCursada(
                cursada_id=cursada.id,
                materia_nombre=cursada.materia.nombre if cursada.materia else "N/A",
                cuatrimestre_info=cuatri_info,
                cantidad_respuestas=cantidad_sets,
                resultados_por_seccion=resultados_secciones_schema,
                informe_curricular_instancia_id=informe_id,
                fecha_cierre=instancia.fecha_fin
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

def _obtener_plantilla_informe_activa(db: Session) -> int:
    
    stmt = select(instrumento_models.ActividadCurricular.id).where(
        instrumento_models.ActividadCurricular.estado == EstadoInstrumento.PUBLICADA,
        instrumento_models.ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR
    ).limit(1)
    
    plantilla_id = db.execute(stmt).scalar_one_or_none()
    
    if not plantilla_id:
        raise BadRequest(detail="No se encontró una plantilla de Informe de Actividad Curricular PUBLICADA para instanciar.")
        
    return plantilla_id

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
        cursada_id = instancia.cursada_id
        encuesta_instancia_id = instancia.id
        plantilla_informe_id = _obtener_plantilla_informe_activa(db)
        cursada = db.get(Cursada, cursada_id)
        if not cursada or not cursada.profesor_id: 
             raise BadRequest(detail=f"La Cursada con ID {cursada_id} no tiene un profesor asignado.")
        
        profesor_id = cursada.profesor_id
        existe_instancia = db.query(instrumento_models.ActividadCurricularInstancia).filter(
            instrumento_models.ActividadCurricularInstancia.cursada_id == cursada_id
        ).first()
        if existe_instancia:
            raise BadRequest(detail=f"Ya existe un informe de actividad curricular (ID {existe_instancia.id}) para la cursada {cursada_id}. No se crea una nueva instancia.")

        nueva_instancia_informe = instrumento_models.ActividadCurricularInstancia(
            actividad_curricular_id=plantilla_informe_id,
            cursada_id=cursada_id,
            encuesta_instancia_id=encuesta_instancia_id,
            profesor_id=profesor_id,
            estado=EstadoInforme.PENDIENTE,
            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR
        )

        db.add(nueva_instancia_informe)

    except BadRequest as e:
        print(f"ADVERTENCIA: No se pudo instanciar el Informe de Actividad Curricular. Causa: {e.detail}")
    except Exception as e:
        print(f"ERROR grave al intentar instanciar Informe de Actividad Curricular: {e}")
    try:
        db.commit()
        db.refresh(instancia)
    except Exception as e:
        db.rollback()
        print(f"ERROR en commit al cerrar instancia {instancia_id}: {e}")
        raise BadRequest(detail=f"Error al guardar el cambio de estado: {e}")

    return instancia


def listar_profesores_por_departamento(db: Session, departamento_id: int) -> List[Profesor]:
    """
    Obtiene una lista única de profesores que han dado cursadas en
    materias de carreras pertenecientes al departamento dado.
    """
    if not departamento_id:
        raise BadRequest(detail="El administrador no tiene un departamento asignado.")

    stmt = (
        select(Profesor)
        .join(Cursada, Profesor.id == Cursada.profesor_id)
        .join(Materia, Cursada.materia_id == Materia.id)
        .join(Materia.carreras)
        .filter(Carrera.departamento_id == departamento_id)
        .distinct()
        .order_by(Profesor.nombre)
    )
    
    profesores = db.scalars(stmt).all()
    
    return profesores

def listar_materias_por_departamento(db: Session, departamento_id: int) -> List[Materia]:
    """
    Obtiene una lista única de materias pertenecientes a carreras
    del departamento dado.
    """
    if not departamento_id:
        raise BadRequest(detail="El administrador no tiene un departamento asignado.")
        
    stmt = (
        select(Materia)
        .join(Materia.carreras)
        .filter(Carrera.departamento_id == departamento_id)
        .distinct()
        .order_by(Materia.nombre)
    )
    
    materias = db.scalars(stmt).all()
    
    return materias

def _validar_profesor_en_dpto(db: Session, profesor_id: int, departamento_id: int):
    """
    Verifica si un profesor ha dado al menos una cursada en una materia
    que pertenece al departamento.
    """
    profesor = db.get(Profesor, profesor_id)
    if not profesor:
        raise NotFound(detail=f"Profesor con ID {profesor_id} no encontrado.")

    es_valido = db.scalar(
        select(func.count(Profesor.id))
        .join(Cursada, Profesor.id == Cursada.profesor_id)
        .join(Materia, Cursada.materia_id == Materia.id)
        .join(Materia.carreras)
        .filter(Carrera.departamento_id == departamento_id)
        .filter(Profesor.id == profesor_id)
    )
    
    if not es_valido or es_valido == 0:
        raise BadRequest(detail="El profesor seleccionado no pertenece a este departamento.")
    
    return True

def _validar_materia_en_dpto(db: Session, materia_id: int, departamento_id: int):
    """
    Verifica si una materia pertenece a al menos una carrera
    del departamento.
    """
    materia = db.get(Materia, materia_id)
    if not materia:
        raise NotFound(detail=f"Materia con ID {materia_id} no encontrada.")

    es_valida = db.scalar(
        select(func.count(Materia.id))
        .join(Materia.carreras)
        .filter(Carrera.departamento_id == departamento_id)
        .filter(Materia.id == materia_id)
    )
    
    if not es_valida or es_valida == 0:
        raise BadRequest(detail="La materia seleccionada no pertenece a este departamento.")
    
    return True


def obtener_resultados_agregados_para_profesor(
    db: Session,
    profesor_id: int,
    departamento_id: int
) -> List[schemas.ResultadoCursada]:
    """
    Busca todas las estadísticas de un profesor, validando
    que pertenezca al departamento.
    
    Esta función es CASI IDÉNTICA a 'obtener_resultados_agregados_profesor'
    (la que usa el rol DOCENTE), solo cambia el filtro inicial.
    """
    
    _validar_profesor_en_dpto(db, profesor_id, departamento_id)
 
    resultados = obtener_resultados_agregados_profesor(db, profesor_id=profesor_id, cuatrimestre_id=None)
    
    if not resultados:
        raise NotFound(detail="No se encontraron resultados de encuestas cerradas para este profesor.")
        
    return resultados


def obtener_resultados_agregados_para_materia(
    db: Session,
    materia_id: int,
    departamento_id: int
) -> List[schemas.ResultadoCursada]:
    """
    Busca todas las estadísticas de una materia, validando
    que pertenezca al departamento.
    
    Es una variación de 'obtener_resultados_agregados_profesor'.
    """
    
    _validar_materia_en_dpto(db, materia_id, departamento_id)

    
    stmt_cursadas = (
        select(Cursada)
        .options(
            joinedload(Cursada.materia), 
            joinedload(Cursada.cuatrimestre),
            joinedload(Cursada.profesor), 
            selectinload(Cursada.encuesta_instancia)
            .selectinload(models.EncuestaInstancia.plantilla) 
            .selectinload(models.Encuesta.secciones)
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
            .selectinload(PreguntaMultipleChoice.opciones),
            
            selectinload(Cursada.actividad_curricular_instancia) 
        )
        .where(Cursada.materia_id == materia_id) 
    )
    
    cursadas_materia = db.execute(stmt_cursadas).scalars().unique().all()
    
    if not cursadas_materia:
        raise NotFound(detail="No se encontraron cursadas para esta materia.")

    resultados_finales: List[schemas.ResultadoCursada] = []

    for cursada in cursadas_materia:
        instancia = cursada.encuesta_instancia

        if not instancia or instancia.estado != EstadoInstancia.CERRADA:
            continue

        plantilla = instancia.plantilla
        if not plantilla or not plantilla.secciones:
            continue 

        
        stmt_respuestas = (
            select(Respuesta)
            .join(RespuestaSet)
            .where(RespuestaSet.instrumento_instancia_id == instancia.id) 
            .options(
                selectinload(RespuestaMultipleChoice.opcion), 
                selectinload(Respuesta.pregunta) 
            )
        )
        todas_las_respuestas = db.execute(stmt_respuestas).scalars().all()
        cantidad_sets = db.query(func.count(RespuestaSet.id)).filter(RespuestaSet.instrumento_instancia_id == instancia.id).scalar() or 0
        
        if cantidad_sets == 0 and not todas_las_respuestas: 
             continue

        resultados_por_pregunta_dict: Dict[int, Dict[str, Any]] = collections.defaultdict(lambda: {"opciones": collections.defaultdict(int), "textos": []})
        for respuesta in todas_las_respuestas:
            pid = respuesta.pregunta_id
            if isinstance(respuesta, RespuestaMultipleChoice):
                if respuesta.opcion_id is not None and respuesta.opcion:
                    resultados_por_pregunta_dict[pid]["opciones"][respuesta.opcion_id] += 1
            elif isinstance(respuesta, RespuestaRedaccion):
                 if respuesta.texto is not None: 
                     resultados_por_pregunta_dict[pid]["textos"].append(schemas.RespuestaTextoItem(texto=respuesta.texto))

        resultados_secciones_schema: List[schemas.ResultadoSeccion] = [] 
        for seccion in plantilla.secciones:
            if not seccion.preguntas: continue
            preguntas_de_esta_seccion: List[schemas.ResultadoPregunta] = []
            for pregunta in seccion.preguntas:
                resultados_opciones_schema: List[schemas.ResultadoOpcion] = []
                respuestas_texto_schema: List[schemas.RespuestaTextoItem] = []
                pregunta_resultados = resultados_por_pregunta_dict.get(pregunta.id)
                if isinstance(pregunta, PreguntaMultipleChoice):
                    if not pregunta.opciones: continue 
                    for opcion in pregunta.opciones:
                         cantidad = pregunta_resultados["opciones"].get(opcion.id, 0) if pregunta_resultados else 0
                         resultados_opciones_schema.append(
                             schemas.ResultadoOpcion(
                                 opcion_id=opcion.id,
                                 opcion_texto=opcion.texto,
                                 cantidad=cantidad
                             )
                         )
                    preguntas_de_esta_seccion.append(
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
                    preguntas_de_esta_seccion.append(
                        schemas.ResultadoPregunta(
                            pregunta_id=pregunta.id,
                            pregunta_texto=pregunta.texto,
                            pregunta_tipo=pregunta.tipo,
                            resultados_opciones=None, 
                            respuestas_texto=respuestas_texto_schema
                        )
                    )
            if preguntas_de_esta_seccion:
                resultados_secciones_schema.append(
                    schemas.ResultadoSeccion(
                        seccion_nombre=seccion.nombre,
                        resultados_por_pregunta=preguntas_de_esta_seccion
                    )
                )

        cuatri_info = "N/A"
        if cursada.cuatrimestre:
             periodo_val = cursada.cuatrimestre.periodo.value if cursada.cuatrimestre.periodo else '?'
             cuatri_info = f"{cursada.cuatrimestre.anio} - {periodo_val}"
        
        informe_id = None
        if (cursada.actividad_curricular_instancia and 
            cursada.actividad_curricular_instancia.estado == EstadoInforme.PENDIENTE):
            informe_id = cursada.actividad_curricular_instancia.id
        

        materia_nombre_con_profesor = f"{cursada.materia.nombre} (Prof: {cursada.profesor.nombre if cursada.profesor else 'N/A'})"
        
        resultados_finales.append(
            schemas.ResultadoCursada(
                cursada_id=cursada.id,
                materia_nombre=materia_nombre_con_profesor, 
                cuatrimestre_info=cuatri_info,
                cantidad_respuestas=cantidad_sets,
                resultados_por_seccion=resultados_secciones_schema,
                informe_curricular_instancia_id=informe_id 
            )
        )

    if not resultados_finales:
        raise NotFound(detail="No se encontraron resultados de encuestas cerradas para esta materia.")
        
    return resultados_finales