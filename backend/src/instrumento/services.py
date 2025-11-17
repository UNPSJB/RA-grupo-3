from sqlalchemy.orm import Session, selectinload, joinedload
from src.instrumento import models, schemas
from src.enumerados import TipoInstrumento,EstadoInstrumento,EstadoInforme
from src.encuestas.models import Encuesta
from typing import List
from sqlalchemy import select, func
from fastapi import HTTPException
from src.seccion.models import Seccion
from src.instrumento.models import ActividadCurricularInstancia
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.instrumento.models import (
    ActividadCurricularInstancia, 
    InformeSintetico, 
    InformeSinteticoInstancia
)
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.persona.models import AdminDepartamento
from src.materia.models import Departamento, Carrera, Materia, Cursada
from src.exceptions import BadRequest, NotFound

import collections
from src.encuestas.schemas import (
    ResultadoSeccion, 
    ResultadoPregunta, 
    ResultadoOpcion, 
    RespuestaTextoItem,
    InformeSinteticoResultado # <-- nuevo schema
)
from src.respuesta.models import Respuesta, RespuestaSet, RespuestaMultipleChoice, RespuestaRedaccion
from src.enumerados import TipoPregunta

def get_instrumento_completo(db: Session, instrumento_id: int) -> models.InstrumentoBase:
    instrumento = db.query(models.InstrumentoBase).options(
        selectinload(models.InstrumentoBase.secciones).options(
            selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)).options(
                selectinload(PreguntaMultipleChoice.opciones)
            )
        )
    ).filter(models.InstrumentoBase.id == instrumento_id).first()

    if not instrumento:
        raise HTTPException(status_code=404, detail="Instrumento no encontrado")
    return instrumento

def crear_instrumento_plantilla(
    db: Session, 
    plantilla_data: schemas.InstrumentoPlantillaCreate
) -> models.InstrumentoBase: 
    datos_base = {
        "titulo": plantilla_data.titulo,
        "descripcion": plantilla_data.descripcion
    }
    db_plantilla = None
    
    match plantilla_data.tipo:
        case TipoInstrumento.ENCUESTA:
            datos_base["anexo"] = "Anexos I/II (DCDFI N° 005/2014)" 
            db_plantilla = Encuesta(**datos_base)

        case TipoInstrumento.ACTIVIDAD_CURRICULAR:
            datos_base["anexo"] = "Anexo I (RCDFI N° 283/2015)" 
            db_plantilla = models.ActividadCurricular(**datos_base)

        case TipoInstrumento.INFORME_SINTETICO:
            datos_base["anexo"] = "Anexo II (RCDFI N° 283/2015)" 
            db_plantilla = models.InformeSintetico(**datos_base)

        case _:
            raise ValueError("Tipo de instrumento no válido")
    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    
    return db_plantilla

def get_plantilla_por_id(db: Session, plantilla_id: int) -> models.InstrumentoBase | None:
    return db.get(models.InstrumentoBase, plantilla_id)

def listar_plantillas_por_estado(
    db: Session, 
    estado: EstadoInstrumento
) -> List[models.InstrumentoBase]:
    

    statement = select(models.InstrumentoBase).where(
        models.InstrumentoBase.estado == estado
    ).order_by(models.InstrumentoBase.id.desc())
    
    return db.scalars(statement).all()

def publicar_plantilla(
    db: Session, 
    plantilla_id: int
) -> models.InstrumentoBase:
    db_plantilla = get_plantilla_por_id(db, plantilla_id)
    if not db_plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    # Cambia el estado
    db_plantilla.estado = EstadoInstrumento.PUBLICADA
    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    return db_plantilla

# --- 4. ELIMINAR (Para "Borrar") ---
def eliminar_plantilla(db: Session, plantilla_id: int):
    db_plantilla = get_plantilla_por_id(db, plantilla_id)
    if not db_plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    db.delete(db_plantilla)
    db.commit()
    return

def actualizar_plantilla(
    db: Session, 
    plantilla_id: int, 
    data: schemas.InstrumentoPlantillaUpdate
) -> models.InstrumentoBase:
    db_plantilla = get_plantilla_por_id(db, plantilla_id)
    if not db_plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plantilla, key, value)
    
    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    return db_plantilla

def get_plantilla_para_instancia_reporte(
    db: Session, 
    instancia_id: int,
    profesor_id: int # Para verificar permisos
) -> models.InstrumentoBase:
    """
    Obtiene la plantilla (InstrumentoBase) completa con preguntas y opciones
    para una instancia de Actividad Curricular (un reporte) específica,
    verificando que pertenezca al profesor.
    """
    
    # 1. Busca la Instancia del Reporte
    instancia = db.query(ActividadCurricularInstancia)\
        .filter(ActividadCurricularInstancia.id == instancia_id)\
        .options(
            # 2. Carga la Plantilla (ActividadCurricular) asociada
            selectinload(ActividadCurricularInstancia.actividad_curricular) 
            # 3. Carga las Secciones de esa plantilla
            .selectinload(models.ActividadCurricular.secciones) 
            # 4. Carga las Preguntas de esas secciones
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)) 
            # 5. Carga las Opciones de esas preguntas
            .selectinload(PreguntaMultipleChoice.opciones)
        )\
        .first()

    if not instancia:
        raise HTTPException(status_code=404, detail=f"Instancia de reporte con ID {instancia_id} no encontrada.")
    
    # Verificación de permisos
    if instancia.profesor_id != profesor_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para responder este reporte.")
    
    # Verificación de estado
    if instancia.estado != EstadoInforme.PENDIENTE:
            raise HTTPException(status_code=400, detail=f"El reporte {instancia_id} no está pendiente, no se puede responder.")

    if not instancia.actividad_curricular:
            raise HTTPException(status_code=500, detail=f"La instancia {instancia_id} no tiene una plantilla de reporte asociada.")

    # Devuelve la plantilla (InstrumentoBase) completa
    return instancia.actividad_curricular

def _obtener_plantilla_sintetico_activa(db: Session) -> int:
    stmt = select(InformeSintetico.id).where(
        InformeSintetico.estado == EstadoInstrumento.PUBLICADA,
        InformeSintetico.tipo == TipoInstrumento.INFORME_SINTETICO
    ).limit(1)

    plantilla_id = db.execute(stmt).scalar_one_or_none()

    if not plantilla_id:
        raise BadRequest(detail="No se encontro una plantilla de Informe Sintetico")
    
    return(plantilla_id)

def crear_informe_sintetico_para_departamento(
        db: Session,
        admin_dpto: AdminDepartamento,
) -> models.InformeSinteticoInstancia:
    
    if not admin_dpto.departamento_id:
        raise BadRequest(detail="El usuario admin no esta vinculado a ningun departamento")
    
    try:
        plantilla_sintetico_id = _obtener_plantilla_sintetico_activa(db)
    except BadRequest as e:
        raise e
    
    departamento = db.get(Departamento, admin_dpto.departamento_id)
    if not departamento:
        raise NotFound(detail=f"Departamento ID {admin_dpto.departamento_id} no encontrado.")
    
    print(f"Iniciando sintesis para el Dpto: {departamento.nombre}")

    cursada_ids_query = (
        select(Cursada.id)
        .join(Materia, Cursada.materia_id == Materia.id)
        .join(Materia.carreras)
        .filter(Carrera.departamento_id == departamento.id)
    )
    cursada_ids = db.execute(cursada_ids_query).scalars().all()
    if not cursada_ids:
        raise NotFound(detail="No se encontraron cursadas para este departamento.")
    
    reportes_a_sintetizar = db.scalars(
        select(ActividadCurricularInstancia)
        .where(
            ActividadCurricularInstancia.cursada_id.in_(cursada_ids),
            ActividadCurricularInstancia.estado == EstadoInforme.COMPLETADO,
            ActividadCurricularInstancia.informe_sintetico_instancia_id == None
        )
    ).all()

    if not reportes_a_sintetizar:
        raise NotFound(detail="No hay nuevos reportes de profesores completados para sintetizar.")

    print(f"   + Se encontraron {len(reportes_a_sintetizar)} reportes de profesores para sintetizar.")

    nuevo_informe_sintetico = InformeSinteticoInstancia(
        informe_sintetico_id=plantilla_sintetico_id,
        departamento_id=departamento.id,
        tipo=TipoInstrumento.INFORME_SINTETICO
    )

    nuevo_informe_sintetico.actividades_curriculares_instancia = reportes_a_sintetizar
    
    db.add(nuevo_informe_sintetico)
    
    try:
        db.commit()
        db.refresh(nuevo_informe_sintetico)
        print(f"   -> Creado Informe Sintético ID: {nuevo_informe_sintetico.id}")
        return nuevo_informe_sintetico
    except Exception as e:
        db.rollback()
        print(f"ERROR al guardar el Informe Sintético: {e}")
        raise BadRequest(detail=f"Error al guardar el informe: {e}")
    


# ACA EMPIEZA TODOOOOOO

def listar_informes_sinteticos_por_departamento(
    db: Session, 
    admin_depto: AdminDepartamento
) -> List[schemas.InformeSinteticoInstanciaList]:
    """
    Lista todos los Informes Sintéticos generados para el departamento del admin.
    """
    if not admin_depto.departamento_id:
        raise BadRequest(detail="El usuario administrador no está vinculado a ningún departamento.")

    informes = db.scalars(
        select(models.InformeSinteticoInstancia)
        .where(models.InformeSinteticoInstancia.departamento_id == admin_depto.departamento_id)
        .options(
            joinedload(models.InformeSinteticoInstancia.informe_sintetico), # Carga la plantilla
            joinedload(models.InformeSinteticoInstancia.actividades_curriculares_instancia) # Carga los reportes
        )
        .order_by(models.InformeSinteticoInstancia.fecha_inicio.desc())
    ).unique().all()
    
    # Mapeamos al schema de lista
    lista_resultados = []
    for informe in informes:
        schema_list_item = schemas.InformeSinteticoInstanciaList(
            id=informe.id,
            fecha_inicio=informe.fecha_inicio,
            fecha_fin=informe.fecha_fin,
            tipo=informe.tipo,
            plantilla=informe.informe_sintetico, # La plantilla base
            departamento_id=informe.departamento_id,
            cantidad_reportes=len(informe.actividades_curriculares_instancia)
        )
        lista_resultados.append(schema_list_item)
        
    return lista_resultados


def obtener_estadisticas_informe_sintetico(
    db: Session, 
    informe_sintetico_id: int, 
    admin_depto: AdminDepartamento
) -> InformeSinteticoResultado:
    """
    Obtiene y agrega los resultados de todas las respuestas de profesores
    (ACI) contenidas en un Informe Sintético específico.
    """
    
    # 1. Validar permisos y obtener el informe
    informe = db.get(models.InformeSinteticoInstancia, informe_sintetico_id)
    if not informe:
        raise NotFound(detail=f"Informe Sintético con ID {informe_sintetico_id} no encontrado.")
    if informe.departamento_id != admin_depto.departamento_id:
        raise BadRequest(detail="No tiene permisos para ver este informe.")
    
    # 2. Cargar el informe con todas sus relaciones anidadas
    informe_completo = db.scalar(
        select(models.InformeSinteticoInstancia)
        .where(models.InformeSinteticoInstancia.id == informe_sintetico_id)
        .options(
            joinedload(models.InformeSinteticoInstancia.departamento),
            joinedload(models.InformeSinteticoInstancia.informe_sintetico) # Plantilla base
                .selectinload(models.InformeSintetico.secciones)
                .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
                .selectinload(PreguntaMultipleChoice.opciones),
            joinedload(models.InformeSinteticoInstancia.actividades_curriculares_instancia) # Reportes ACI
                .selectinload(ActividadCurricularInstancia.respuesta_sets) # Sets de respuestas
                .selectinload(RespuestaSet.respuestas) # Respuestas individuales
                .selectinload(RespuestaMultipleChoice.opcion)
        )
    )

    if not informe_completo:
        raise NotFound(detail="Informe no pudo ser cargado.")

    plantilla = informe_completo.informe_sintetico
    reportes_aci = informe_completo.actividades_curriculares_instancia
    
    if not plantilla or not plantilla.secciones:
        raise NotFound(detail="La plantilla del informe sintético no tiene secciones o preguntas.")

    # 3. Agregar todas las respuestas
    # (Similar a 'obtener_resultados_agregados_profesor' pero iterando sobre 'reportes_aci')
    
    resultados_por_pregunta_dict: Dict[int, Dict[str, Any]] = collections.defaultdict(
        lambda: {"opciones": collections.defaultdict(int), "textos": []}
    )
    
    cantidad_total_reportes = len(reportes_aci)
    
    for aci in reportes_aci:
        for r_set in aci.respuesta_sets:
            for respuesta in r_set.respuestas:
                pid = respuesta.pregunta_id
                if isinstance(respuesta, RespuestaMultipleChoice) and respuesta.opcion:
                    resultados_por_pregunta_dict[pid]["opciones"][respuesta.opcion_id] += 1
                elif isinstance(respuesta, RespuestaRedaccion) and respuesta.texto:
                    resultados_por_pregunta_dict[pid]["textos"].append(RespuestaTextoItem(texto=respuesta.texto))

    # 4. Construir el Schema de Respuesta (Resultados por Sección)
    resultados_secciones_schema: List[ResultadoSeccion] = [] 

    for seccion in plantilla.secciones:
        if not seccion.preguntas: continue
        
        preguntas_de_esta_seccion: List[ResultadoPregunta] = []

        for pregunta in seccion.preguntas:
            resultados_opciones_schema: List[ResultadoOpcion] = []
            respuestas_texto_schema: List[RespuestaTextoItem] = []
            
            pregunta_resultados = resultados_por_pregunta_dict.get(pregunta.id)
            
            if isinstance(pregunta, PreguntaMultipleChoice):
                if not pregunta.opciones: continue
                for opcion in pregunta.opciones:
                    cantidad = pregunta_resultados["opciones"].get(opcion.id, 0) if pregunta_resultados else 0
                    resultados_opciones_schema.append(
                        ResultadoOpcion(
                            opcion_id=opcion.id,
                            opcion_texto=opcion.texto,
                            cantidad=cantidad
                        )
                    )
                
                preguntas_de_esta_seccion.append(
                    ResultadoPregunta(
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
                    ResultadoPregunta(
                        pregunta_id=pregunta.id,
                        pregunta_texto=pregunta.texto,
                        pregunta_tipo=pregunta.tipo,
                        resultados_opciones=None,
                        respuestas_texto=respuestas_texto_schema
                    )
                )
        
        if preguntas_de_esta_seccion:
            resultados_secciones_schema.append(
                ResultadoSeccion(
                    seccion_nombre=seccion.nombre,
                    resultados_por_pregunta=preguntas_de_esta_seccion
                )
            )

    # 5. Devolver el schema final
    return InformeSinteticoResultado(
        informe_id=informe_completo.id,
        departamento_nombre=informe_completo.departamento.nombre if informe_completo.departamento else "N/A",
        fecha_generacion=informe_completo.fecha_inicio,
        cantidad_total_reportes=cantidad_total_reportes,
        resultados_por_seccion=resultados_secciones_schema
    )