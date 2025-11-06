from sqlalchemy.orm import Session
from sqlalchemy import update
from src.enumerados import EstadoInstancia
from src.respuesta import models as respuesta_models, schemas as respuesta_schemas
from src.encuestas.models import EncuestaInstancia
from src.pregunta.models import Pregunta, Opcion, TipoPregunta
from src.exceptions import NotFound, BadRequest
from src.persona.models import Inscripcion

def crear_submission_anonima( 
    db: Session,
    instancia_id: int,
    alumno_id: int,
    respuestas_data: respuesta_schemas.RespuestaSetCreate
) -> respuesta_models.RespuestaSet:

    # 1. Validamos la Instancia
    instancia = db.get(EncuestaInstancia, instancia_id)
    if not instancia:
        raise NotFound(f"EncuestaInstancia con id {instancia_id} no encontrada.")
    if instancia.estado != EstadoInstancia.ACTIVA:
         raise BadRequest(f"La encuesta instancia {instancia_id} no está activa.")


    # 2. Creamos el RespuestaSet 
    nuevo_set = respuesta_models.RespuestaSet(instrumento_instancia_id=instancia_id)
    db.add(nuevo_set)
    db.flush() # Para obtener el ID del set

    # 3. Procesamos y Creamos Respuestas Individuales 
    ids_preguntas_respondidas = set()
    for resp_individual_data in respuestas_data.respuestas:
        if resp_individual_data.pregunta_id in ids_preguntas_respondidas:
             raise BadRequest(f"Se envió más de una respuesta para la pregunta ID {resp_individual_data.pregunta_id}.")
        ids_preguntas_respondidas.add(resp_individual_data.pregunta_id)

        pregunta = db.get(Pregunta, resp_individual_data.pregunta_id)
        if not pregunta:
            raise NotFound(f"Pregunta con id {resp_individual_data.pregunta_id} no encontrada.")

        # Validamos la consistencia pregunta/respuesta
        if pregunta.tipo == TipoPregunta.REDACCION:
            # ... (validaciones de texto vs opcion_id)
            nueva_respuesta = respuesta_models.RespuestaRedaccion(
                pregunta_id=pregunta.id,
                respuesta_set_id=nuevo_set.id,
                texto=resp_individual_data.texto,
                tipo=TipoPregunta.REDACCION
            )
        elif pregunta.tipo == TipoPregunta.MULTIPLE_CHOICE:
            # ... (validaciones de texto vs opcion_id y existencia de opción)
            opcion = db.get(Opcion, resp_individual_data.opcion_id)
            if not opcion or opcion.pregunta_id != pregunta.id:
                 raise NotFound(f"Opción con id {resp_individual_data.opcion_id} no es válida para la pregunta {pregunta.id}.")

            nueva_respuesta = respuesta_models.RespuestaMultipleChoice(
                pregunta_id=pregunta.id,
                respuesta_set_id=nuevo_set.id,
                opcion_id=resp_individual_data.opcion_id,
                tipo=TipoPregunta.MULTIPLE_CHOICE
            )
        else:
             raise NotImplementedError(f"Tipo de pregunta no soportado: {pregunta.tipo}")

        db.add(nueva_respuesta)

    stmt_update = (
        update(Inscripcion)
        .where(Inscripcion.cursada_id == instancia.cursada_id) 
        .where(Inscripcion.alumno_id == alumno_id) 
        .values(ha_respondido=True)
    )
    db.execute(stmt_update)
    # 4. Commit de toda la transacción
    db.commit()
    db.refresh(nuevo_set)
    return nuevo_set