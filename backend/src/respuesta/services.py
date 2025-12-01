from sqlalchemy.orm import Session
from sqlalchemy import update
from src.enumerados import EstadoInstancia, EstadoInforme
from src.respuesta import models as respuesta_models, schemas as respuesta_schemas
from src.instrumento.models import ActividadCurricularInstancia, InformeSinteticoInstancia
from src.encuestas.models import EncuestaInstancia
from src.pregunta.models import Pregunta, Opcion, TipoPregunta
from src.exceptions import NotFound, BadRequest, PermissionDenied
from src.persona.models import Inscripcion
import unicodedata

def normalize_text(text: str) -> str:
    if not text: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text) 
                   if unicodedata.category(c) != 'Mn').lower()

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
        # 1. Evitar respuestas duplicadas para la misma pregunta en un mismo set
        if resp_data.pregunta_id in ids_preguntas_respondidas:
             continue 
        ids_preguntas_respondidas.add(resp_data.pregunta_id)

        # 2. Obtener pregunta
        pregunta = db.get(Pregunta, resp_data.pregunta_id)
        if not pregunta:
            raise NotFound(f"Pregunta con id {resp_data.pregunta_id} no encontrada.")

        nueva_respuesta = None

        # 3. Validar y crear objeto Respuesta según el tipo
        if pregunta.tipo == TipoPregunta.REDACCION:
            # Permitimos texto vacío si el usuario desea borrar contenido
            texto_respuesta = resp_data.texto if resp_data.texto is not None else ""
            
            nueva_respuesta = respuesta_models.RespuestaRedaccion(
                pregunta_id=pregunta.id,
                respuesta_set_id=respuesta_set_id,
                texto=texto_respuesta,
                tipo=TipoPregunta.REDACCION
            )

        elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
            # Validar que la opción exista y pertenezca a la pregunta
            if resp_data.opcion_id:
                opcion = db.get(Opcion, resp_data.opcion_id)
                if not opcion or opcion.pregunta_id != pregunta.id:
                     raise NotFound(f"Opción con id {resp_data.opcion_id} no es válida para la pregunta {pregunta.id}.")

                nueva_respuesta = respuesta_models.RespuestaMultipleChoice(
                    pregunta_id=pregunta.id,
                    respuesta_set_id=respuesta_set_id,
                    opcion_id=resp_data.opcion_id,
                    tipo=TipoPregunta.MULTIPLE_CHOICE
                )
        
        if nueva_respuesta:
            db.add(nueva_respuesta)


def crear_submission_anonima( 
    db: Session,
    instancia_id: int,
    alumno_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate
) -> respuesta_models.RespuestaSet:
    """
    Guarda las respuestas de una encuesta de alumno.
    Aquí SÍ mantenemos la restricción: solo se puede responder si está ACTIVA.
    """
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
    
    if instancia.departamento_id != departamento_id:
        raise PermissionDenied("No tienes permiso para completar un informe de otro departamento.")

    # --- LÓGICA DE INTERCEPCIÓN CORREGIDA ---
    respuestas_comunes = []
    texto_integrantes = None

    for resp in respuestas_data.respuestas:
        preg = db.get(Pregunta, resp.pregunta_id)
        if not preg: continue
        
        t_norm = normalize_text(preg.texto)
        
        # CAMBIO: Solo interceptamos si dice "integrante" Y "comision"
        # Esto evita que se confunda con "integrantes de cátedra" (Sección 3)
        if "integrante" in t_norm and "comision" in t_norm:
            texto_integrantes = resp.texto
        else:
            respuestas_comunes.append(resp)

    if texto_integrantes is not None:
        instancia.integrantes_comision = texto_integrantes
        db.add(instancia)

    # ... (resto de la función igual: Crear RespuestaSet, _procesar_y_guardar, etc.)
    nuevo_set = respuesta_models.RespuestaSet(instrumento_instancia_id=instancia_id)
    db.add(nuevo_set)
    db.flush() 

    _procesar_y_guardar_respuestas(db, nuevo_set.id, respuestas_comunes)

    instancia.estado = EstadoInforme.COMPLETADO
    db.add(instancia)
    
    db.commit()
    db.refresh(nuevo_set)
    return nuevo_set


def obtener_respuestas_por_instancia(db: Session, instancia_id: int) -> dict:
    """
    Recupera las respuestas de la última versión (RespuestaSet más reciente) guardada para una instancia.
    Devuelve un diccionario: { pregunta_id: valor }
    Donde valor es 'texto' (str) o 'opcion_id' (int).
    """
    # 1. Buscar el último set de respuestas (orden descendente por fecha)
    respuesta_set = db.query(respuesta_models.RespuestaSet).filter(
        respuesta_models.RespuestaSet.instrumento_instancia_id == instancia_id
    ).order_by(respuesta_models.RespuestaSet.created_at.desc()).first()

    if not respuesta_set:
        return {}

    # 2. Mapear respuestas
    respuestas_dict = {}
    for r in respuesta_set.respuestas:
        if r.tipo == TipoPregunta.REDACCION:
            respuestas_dict[r.pregunta_id] = r.texto
        elif r.tipo == TipoPregunta.MULTIPLE_CHOICE:
            respuestas_dict[r.pregunta_id] = r.opcion_id
    
    return respuestas_dict