from sqlalchemy.orm import Session
from sqlalchemy import update
from src.enumerados import EstadoInstancia, EstadoInforme
from src.respuesta import models as respuesta_models, schemas as respuesta_schemas
from src.instrumento.models import ActividadCurricularInstancia, InformeSinteticoInstancia
from src.encuestas.models import EncuestaInstancia
from src.pregunta.models import Pregunta, Opcion, TipoPregunta
from src.exceptions import NotFound, BadRequest, PermissionDenied
from src.persona.models import Inscripcion


def _procesar_y_guardar_respuestas(
    db: Session, 
    respuesta_set_id: int, 
    lista_respuestas: list[respuesta_schemas.RespuestaIndividualCreate]
):
    """
    Lógica común para iterar, validar y guardar las respuestas individuales
    vinculadas a un RespuestaSet ya creado.
    """
    ids_preguntas_respondidas = set()

    for resp_data in lista_respuestas:
        # 1. Evitar respuestas duplicadas para la misma pregunta
        if resp_data.pregunta_id in ids_preguntas_respondidas:
             raise BadRequest(f"Se envió más de una respuesta para la pregunta ID {resp_data.pregunta_id}.")
        ids_preguntas_respondidas.add(resp_data.pregunta_id)

        # 2. Obtener pregunta
        pregunta = db.get(Pregunta, resp_data.pregunta_id)
        if not pregunta:
            raise NotFound(f"Pregunta con id {resp_data.pregunta_id} no encontrada.")

        # 3. Validar y crear objeto Respuesta según el tipo
        if pregunta.tipo == TipoPregunta.REDACCION:
            if not resp_data.texto:
                 # Opcional: Podrías permitir texto vacío si no es obligatoria, pero por ahora validamos que exista
                 pass 
            
            nueva_respuesta = respuesta_models.RespuestaRedaccion(
                pregunta_id=pregunta.id,
                respuesta_set_id=respuesta_set_id,
                texto=resp_data.texto,
                tipo=TipoPregunta.REDACCION
            )

        elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
            # Validar que la opción exista y pertenezca a la pregunta
            opcion = db.get(Opcion, resp_data.opcion_id)
            if not opcion or opcion.pregunta_id != pregunta.id:
                 raise NotFound(f"Opción con id {resp_data.opcion_id} no es válida para la pregunta {pregunta.id}.")

            nueva_respuesta = respuesta_models.RespuestaMultipleChoice(
                pregunta_id=pregunta.id,
                respuesta_set_id=respuesta_set_id,
                opcion_id=resp_data.opcion_id,
                tipo=TipoPregunta.MULTIPLE_CHOICE
            )
        else:
             raise NotImplementedError(f"Tipo de pregunta no soportado: {pregunta.tipo}")

        db.add(nueva_respuesta)



def crear_submission_anonima( 
    db: Session,
    instancia_id: int,
    alumno_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate
) -> respuesta_models.RespuestaSet:

    # 1. Validaciones Específicas (Alumno)
    instancia = db.get(EncuestaInstancia, instancia_id)
    if not instancia:
        raise NotFound(f"EncuestaInstancia con id {instancia_id} no encontrada.")
    if instancia.estado != EstadoInstancia.ACTIVA:
         raise BadRequest(f"La encuesta instancia {instancia_id} no está activa.")

    # 2. Crear RespuestaSet
    nuevo_set = respuesta_models.RespuestaSet(instrumento_instancia_id=instancia_id)
    db.add(nuevo_set)
    db.flush() 

    # 3. Usar lógica común
    _procesar_y_guardar_respuestas(db, nuevo_set.id, respuestas_data.respuestas)

    # 4. Efecto Secundario Específico (Marcar inscripción como respondida)
    stmt_update = (
        update(Inscripcion)
        .where(Inscripcion.cursada_id == instancia.cursada_id) 
        .where(Inscripcion.alumno_id == alumno_id) 
        .values(ha_respondido=True)
    )
    db.execute(stmt_update)

    db.commit()
    db.refresh(nuevo_set)
    return nuevo_set


def crear_submission_profesor( 
    db: Session,
    instancia_id: int,
    profesor_id: int, # (Nota: Podrías usar esto para validar ownership si quisieras)
    respuestas_data: respuesta_schemas.RespuestaSetCreate
) -> respuesta_models.RespuestaSet:

    # 1. Validaciones Específicas (Profesor)
    instancia = db.get(ActividadCurricularInstancia, instancia_id)
    if not instancia:
        raise NotFound(f"ActividadCurricularInstancia con id {instancia_id} no encontrada.")
    if instancia.estado != EstadoInforme.PENDIENTE:
         raise BadRequest(f"El informe {instancia_id} no está pendiente.")

    # 2. Crear RespuestaSet
    nuevo_set = respuesta_models.RespuestaSet(instrumento_instancia_id=instancia_id)
    db.add(nuevo_set)
    db.flush()

    # 3. Usar lógica común
    _procesar_y_guardar_respuestas(db, nuevo_set.id, respuestas_data.respuestas)

    # 4. Efecto Secundario Específico (Cambiar estado informe)
    instancia.estado = EstadoInforme.COMPLETADO
    db.add(instancia)
    
    db.commit()
    db.refresh(nuevo_set)
    return nuevo_set


def crear_submission_departamento( 
    db: Session,
    instancia_id: int,
    departamento_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate
) -> respuesta_models.RespuestaSet:

    # 1. Validamos la Instancia
    instancia = db.get(InformeSinteticoInstancia, instancia_id)
    if not instancia:
        raise NotFound(f"Informe Sintético con id {instancia_id} no encontrado.")
    
    # --- VALIDACIÓN DE DEPARTAMENTO ---
    # Verificamos que la instancia pertenezca al departamento del usuario
    if instancia.departamento_id != departamento_id:
        raise PermissionDenied("No tienes permiso para completar un informe de otro departamento.")
    # ----------------------------------
    if instancia.estado == EstadoInforme.COMPLETADO:
        raise BadRequest("Este informe ya fue completado.")

    # 2. Crear RespuestaSet 
    nuevo_set = respuesta_models.RespuestaSet(instrumento_instancia_id=instancia_id)
    db.add(nuevo_set)
    db.flush() 

    # 3. Usar lógica común
    _procesar_y_guardar_respuestas(db, nuevo_set.id, respuestas_data.respuestas)

    # 4. Efecto Secundario Específico (Cambiar estado a COMPLETADO)
    instancia.estado = EstadoInforme.COMPLETADO
    db.add(instancia)
    
    db.commit()
    db.refresh(nuevo_set)
    return nuevo_set


def obtener_respuestas_por_instancia(db: Session, instancia_id: int) -> dict:
    """
    Recupera las respuestas de la última versión (RespuestaSet) guardada para una instancia.
    Devuelve un diccionario: { pregunta_id: valor }
    Donde valor es 'texto' (str) o 'opcion_id' (int).
    """
    # 1. Buscar el último set de respuestas
    respuesta_set = db.query(respuesta_models.RespuestaSet).filter(
        respuesta_models.RespuestaSet.instrumento_instancia_id == instancia_id
    ).order_by(respuesta_models.RespuestaSet.created_at.desc()).first()

    if not respuesta_set:
        return {}

    # 2. Mapear respuestas
    respuestas_dict = {}
    for r in respuesta_set.respuestas:
        if r.tipo == TipoPregunta.REDACCION:
            # Casteamos a RespuestaRedaccion para acceder a .texto
            respuestas_dict[r.pregunta_id] = r.texto
        elif r.tipo == TipoPregunta.MULTIPLE_CHOICE:
            # Casteamos a RespuestaMultipleChoice para acceder a .opcion_id
            respuestas_dict[r.pregunta_id] = r.opcion_id
    
    return respuestas_dict