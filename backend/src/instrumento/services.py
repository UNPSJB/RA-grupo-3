from datetime import datetime
import collections
from typing import List, Optional

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, selectinload, joinedload
from fastapi import HTTPException

from src.exceptions import BadRequest, NotFound
from src.enumerados import TipoInstrumento, EstadoInstrumento, EstadoInforme

# Modelos
from src.instrumento import models, schemas
from src.instrumento.models import (
    ActividadCurricularInstancia, 
    InformeSinteticoInstancia, 
    InformeSintetico
)
from src.encuestas.models import Encuesta
from src.materia.models import (
    Cursada, 
    Materia, 
    Carrera, 
    Departamento, 
    carrera_materia_association,
    Cuatrimestre
)
from src.persona.models import AdminDepartamento
from src.pregunta.models import Pregunta, PreguntaMultipleChoice
from src.respuesta.models import (
    Respuesta, 
    RespuestaMultipleChoice, 
    RespuestaRedaccion, 
    RespuestaSet
)
from src.seccion.models import Seccion
from src.encuestas.models import EncuestaInstancia


# Schemas
from src.encuestas import schemas as encuestas_schemas

from src.encuestas.schemas import (
    ResultadoSeccion, 
    ResultadoPregunta, 
    ResultadoOpcion, 
    RespuestaTextoItem,
    InformeSinteticoResultado,
    DashboardDepartamentoStats,
    StatDato
)
from src.materia.models import Cursada


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
    

    estado_string = estado.value

    statement = select(models.InstrumentoBase).where(
        func.lower(models.InstrumentoBase.estado) == func.lower(estado_string)
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
    profesor_id: int
) -> schemas.InstrumentoCompleto:
    
    instancia = db.query(ActividadCurricularInstancia)\
        .filter(ActividadCurricularInstancia.id == instancia_id)\
        .options(
            selectinload(ActividadCurricularInstancia.actividad_curricular) 
            .selectinload(models.ActividadCurricular.secciones) 
            .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice)) 
            .selectinload(PreguntaMultipleChoice.opciones),
            
            joinedload(ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.materia)
            .selectinload(Materia.carreras)
            .joinedload(Carrera.departamento)
            .joinedload(Departamento.sede),

            joinedload(ActividadCurricularInstancia.cursada)
            .joinedload(Cursada.cuatrimestre),
            
            # Usamos joinedload para llegar a cursada (igual que arriba)
            # y LUEGO selectinload para traer sus inscripciones
            joinedload(ActividadCurricularInstancia.cursada)
            .selectinload(Cursada.inscripciones),
            
            joinedload(ActividadCurricularInstancia.profesor)
        )\
        .first()

    if not instancia:
        raise HTTPException(status_code=404, detail=f"Reporte {instancia_id} no encontrado.")
    
    if instancia.profesor_id != profesor_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para este reporte.")
    
    # --- CORRECCIÓN: Eliminamos esta validación para permitir ver historial ---
    # if instancia.estado != EstadoInforme.PENDIENTE:
    #    raise HTTPException(status_code=400, detail="El reporte no está pendiente.")
    # ------------------------------------------------------------------------

    # Lógica de Sedes
    sedes_set = set()
    if instancia.cursada and instancia.cursada.materia:
        for carrera in instancia.cursada.materia.carreras:
            if carrera.departamento and carrera.departamento.sede:
                sedes_set.add(carrera.departamento.sede.localidad)
    sede_str = ", ".join(sedes_set) if sedes_set else "Sede Central"

    # Cálculo de Alumnos
    cant_alumnos = 0
    if instancia.cursada and instancia.cursada.inscripciones:
        cant_alumnos = len(instancia.cursada.inscripciones)

    plantilla_db = instancia.actividad_curricular
    resultado = schemas.InstrumentoCompleto.model_validate(plantilla_db)
    
    resultado.materia_nombre = instancia.cursada.materia.nombre if instancia.cursada else "Desconocida"
    resultado.sede = sede_str
    resultado.anio = instancia.cursada.cuatrimestre.anio if instancia.cursada and instancia.cursada.cuatrimestre else datetime.now().year
    resultado.codigo = instancia.cursada.materia.codigo if instancia.cursada and instancia.cursada.materia else "-"
    resultado.docente_responsable = instancia.profesor.nombre if instancia.profesor else "-"
    
    resultado.cantidad_inscriptos = cant_alumnos

    return resultado

def generar_informe_sintetico_para_departamento(
    db: Session, 
    departamento_id: int,
    fecha_fin_informe: datetime
) -> InformeSinteticoInstancia:
    """
    Busca los Informes Curriculares COMPLETADOS del departamento, 
    crea un Informe Sintético y marca los informes como RESUMIDO.
    """
    
    # 1. Verificar que el departamento exista
    departamento = db.get(Departamento, departamento_id)
    if not departamento:
        raise NotFound(detail=f"Departamento con ID {departamento_id} no encontrado.")
    
    # Obtener año actual
    anio_actual = datetime.now().year 

    # 2. Encontrar la plantilla de Informe Sintético que esté publicada
    stmt_plantilla = select(InformeSintetico.id).where(
        InformeSintetico.estado == EstadoInstrumento.PUBLICADA,
        InformeSintetico.tipo == TipoInstrumento.INFORME_SINTETICO
    ).limit(1)
    
    plantilla_sintetico_id = db.scalars(stmt_plantilla).first()
    if not plantilla_sintetico_id:
        raise BadRequest(detail="No se encontró una plantilla de 'Informe Sintético' publicada.")

    # 3. Encontrar todos los informes de actividad curricular COMPLETADOS y no resumidos
    #    FILTRADOS POR AÑO ACTUAL
    stmt_ac_completadas = (
        select(ActividadCurricularInstancia)
        .join(Cursada, ActividadCurricularInstancia.cursada_id == Cursada.id)
        .join(Cuatrimestre, Cursada.cuatrimestre_id == Cuatrimestre.id) # Join con Cuatrimestre
        .join(Materia, Cursada.materia_id == Materia.id)
        .join(carrera_materia_association, Materia.id == carrera_materia_association.c.materia_id)
        .join(Carrera, carrera_materia_association.c.carrera_id == Carrera.id)
        .where(
            Carrera.departamento_id == departamento_id,
            ActividadCurricularInstancia.estado == EstadoInforme.COMPLETADO,
            ActividadCurricularInstancia.informe_sintetico_instancia_id == None,
            
            # --- FILTRO CRÍTICO ---
            Cuatrimestre.anio == anio_actual
            # ----------------------
        )
    ).distinct()
    
    informes_a_resumir: List[ActividadCurricularInstancia] = db.scalars(stmt_ac_completadas).all()

    if not informes_a_resumir:
        raise NotFound(detail=f"No se encontraron informes de actividad curricular 'Completados' del año {anio_actual} para el departamento '{departamento.nombre}'.")

    # 4. Crear la nueva instancia de Informe Sintético
    print(f"Generando informe sintético para Depto. {departamento_id} con {len(informes_a_resumir)} informes.")
    
    nueva_instancia_sintetica = InformeSinteticoInstancia(
        informe_sintetico_id=plantilla_sintetico_id,
        departamento_id=departamento_id,
        tipo=TipoInstrumento.INFORME_SINTETICO,
        fecha_inicio=datetime.now(),     
        fecha_fin=fecha_fin_informe,
        estado=EstadoInforme.PENDIENTE 
    )
    # 5. Vincular los informes y marcar como RESUMIDO
    for informe_ac in informes_a_resumir:
        informe_ac.informe_sintetico_instancia = nueva_instancia_sintetica
        informe_ac.estado = EstadoInforme.RESUMIDO # Actualiza el estado
        db.add(informe_ac)
        
    db.add(nueva_instancia_sintetica)
    
    try:
        db.commit()
        db.refresh(nueva_instancia_sintetica)
    except Exception as e:
        db.rollback()
        raise BadRequest(detail=f"Error al guardar en BBDD: {e}")

    return nueva_instancia_sintetica


def get_plantilla_para_instancia_sintetico(
    db: Session,
    instancia_id: int,
    departamento_id: Optional[int] = None
) -> models.InstrumentoBase:
    
    instancia = db.query(models.InformeSinteticoInstancia).filter(
        models.InformeSinteticoInstancia.id == instancia_id
    ).options(
        selectinload(models.InformeSinteticoInstancia.informe_sintetico)
        .selectinload(models.InformeSintetico.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).first()

    if not instancia:
        raise HTTPException(status_code=404, detail=f"Instancia de informe sintético {instancia_id} no encontrada.")

    if not instancia.informe_sintetico:
        raise HTTPException(status_code=500, detail="La instancia no tiene una plantilla asociada.")

    return instancia.informe_sintetico
    

def generar_resumen_por_seccion(
    db: Session, 
    instancia_sintetico_id: int, 
    numero_seccion: str,
    materia_id: Optional[int] = None # <--- NUEVO PARÁMETRO
) -> str:
    """
    Recorre los informes curriculares asociados al sintético.
    Busca respuestas de texto en la sección que comienza con 'numero_seccion'.
    Si se pasa materia_id, filtra solo para esa materia.
    """
    instancia = db.query(models.InformeSinteticoInstancia).options(
        selectinload(models.InformeSinteticoInstancia.actividades_curriculares_instancia)
        .selectinload(models.ActividadCurricularInstancia.cursada)
        .selectinload(Cursada.materia)
        .selectinload(Cursada.profesor) # Cargar profesor para mostrar nombre
    ).filter_by(id=instancia_sintetico_id).first()

    if not instancia:
        raise NotFound(detail="Instancia de informe sintético no encontrada")

    resumen_total = ""
    contador = 0

    for aci in instancia.actividades_curriculares_instancia:
        if not aci.cursada or not aci.cursada.materia:
            continue
            
        # --- FILTRO NUEVO ---
        if materia_id and aci.cursada.materia.id != materia_id:
            continue
        # --------------------
            
        profesor_nombre = aci.profesor.nombre if aci.profesor else "Docente"
        
        respuesta_set = db.query(RespuestaSet).filter_by(
            instrumento_instancia_id=aci.id
        ).order_by(RespuestaSet.created_at.desc()).first()

        if not respuesta_set:
            continue

        respuestas_texto = db.query(RespuestaRedaccion).join(Pregunta).join(Seccion)\
            .filter(
                RespuestaRedaccion.respuesta_set_id == respuesta_set.id,
                Seccion.nombre.startswith(numero_seccion) 
            ).all()

        if respuestas_texto:
            contador += 1
            # Si pedimos una materia específica, no hace falta poner el encabezado con el nombre de la materia
            if not materia_id:
                resumen_total += f"--- {aci.cursada.materia.nombre} ({profesor_nombre}) ---\n"
            
            for resp in respuestas_texto:
                texto_limpio = resp.texto.strip()
                # Filtramos textos vacios o genericos del seed si es necesario
                if texto_limpio:
                    resumen_total += f"{texto_limpio}\n"
            
            if not materia_id:
                 resumen_total += "\n"

    if contador == 0:
        return "" # Retornamos vacío para que el frontend decida qué mostrar
        
    return resumen_total.strip()
#Funciones que no estaban 
def listar_informes_sinteticos_por_departamento(
    db: Session, 
    admin: AdminDepartamento
) -> List[schemas.InformeSinteticoInstanciaList]:
    
    if not admin.departamento_id:
        raise BadRequest(detail="El administrador no tiene un departamento asignado.")

    # Buscamos los informes sintéticos de ese departamento
    stmt = (
        select(models.InformeSinteticoInstancia)
        .where(models.InformeSinteticoInstancia.departamento_id == admin.departamento_id)
        .options(
            selectinload(models.InformeSinteticoInstancia.informe_sintetico), 
            selectinload(models.InformeSinteticoInstancia.actividades_curriculares_instancia) 
        )
        .order_by(models.InformeSinteticoInstancia.fecha_inicio.desc())
    )
    
    instancias = db.scalars(stmt).all()
    
    resultados = []
    for inst in instancias:
        resultados.append(schemas.InformeSinteticoInstanciaList(
            id=inst.id,
            fecha_inicio=inst.fecha_inicio,
            fecha_fin=inst.fecha_fin,
            tipo=inst.tipo,
            plantilla=inst.informe_sintetico, 
            departamento_id=inst.departamento_id,
            estado=inst.estado, 

            cantidad_reportes=len(inst.actividades_curriculares_instancia)
        ))
        
    return resultados

def obtener_estadisticas_informe_sintetico(
    db: Session,
    informe_id: int,
    admin: AdminDepartamento
) -> encuestas_schemas.InformeSinteticoResultado:
    
    # 1. Obtener la instancia del Informe Sintético
    informe = db.get(models.InformeSinteticoInstancia, informe_id)
    if not informe:
        raise NotFound(detail="Informe sintético no encontrado.")
    
    if informe.departamento_id != admin.departamento_id:
        raise BadRequest(detail="No tiene permisos para ver este informe.")

    # 2. Identificar todas las Encuestas de Alumnos vinculadas
    ids_encuestas_alumnos = []
    
    # Cargamos la relación necesaria
    informe = db.query(models.InformeSinteticoInstancia).filter_by(id=informe_id).options(
        selectinload(models.InformeSinteticoInstancia.actividades_curriculares_instancia)
    ).first()

    for aci in informe.actividades_curriculares_instancia:
        if aci.encuesta_instancia_id:
            ids_encuestas_alumnos.append(aci.encuesta_instancia_id)
            
    if not ids_encuestas_alumnos:
        return encuestas_schemas.InformeSinteticoResultado(
            informe_id=informe.id,
            departamento_nombre=informe.departamento.nombre if informe.departamento else "Departamento",
            fecha_generacion=informe.fecha_inicio,
            cantidad_total_reportes=0,
            resultados_por_seccion=[]
        )

    # 3. Cargar la Plantilla de Encuesta de Alumno
    # --- CORRECCIÓN AQUÍ: Usar EncuestaInstancia directo, NO models.EncuestaInstancia ---
    primera_encuesta = db.get(EncuestaInstancia, ids_encuestas_alumnos[0]) 
    
    if not primera_encuesta:
         raise NotFound(detail="No se encontró la encuesta base para generar estadísticas.")

    plantilla_encuesta = primera_encuesta.plantilla
    
    plantilla_full = db.query(Encuesta).options(
        selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).filter_by(id=plantilla_encuesta.id).first()

    # 4. AGREGACIÓN DE DATOS
    stmt_respuestas = (
        select(Respuesta)
        .join(RespuestaSet)
        .where(RespuestaSet.instrumento_instancia_id.in_(ids_encuestas_alumnos))
        .options(selectinload(RespuestaMultipleChoice.opcion))
    )
    todas_respuestas = db.scalars(stmt_respuestas).all()

    conteo_global = collections.defaultdict(lambda: collections.defaultdict(int))
    
    for resp in todas_respuestas:
        if isinstance(resp, RespuestaMultipleChoice) and resp.opcion_id:
            conteo_global[resp.pregunta_id][resp.opcion_id] += 1

    # 5. Construir el objeto de respuesta
    resultados_secciones = []

    for seccion in plantilla_full.secciones:
        preguntas_seccion = []
        for preg in seccion.preguntas:
            if isinstance(preg, PreguntaMultipleChoice):
                res_opciones = []
                if preg.opciones:
                    for op in preg.opciones:
                        cant = conteo_global[preg.id][op.id]
                        res_opciones.append(encuestas_schemas.ResultadoOpcion(
                            opcion_id=op.id,
                            opcion_texto=op.texto,
                            cantidad=cant
                        ))
                
                preguntas_seccion.append(encuestas_schemas.ResultadoPregunta(
                    pregunta_id=preg.id,
                    pregunta_texto=preg.texto,
                    pregunta_tipo=preg.tipo,
                    resultados_opciones=res_opciones,
                    respuestas_texto=[]
                ))
        
        if preguntas_seccion:
            resultados_secciones.append(encuestas_schemas.ResultadoSeccion(
                seccion_nombre=seccion.nombre,
                resultados_por_pregunta=preguntas_de_esta_seccion
            ))

    return encuestas_schemas.InformeSinteticoResultado(
        informe_id=informe.id,
        departamento_nombre=informe.departamento.nombre if informe.departamento else "Departamento",
        fecha_generacion=informe.fecha_inicio,
        cantidad_total_reportes=len(ids_encuestas_alumnos),
        resultados_por_seccion=resultados_secciones
    )
#Graficos del dpto


def obtener_dashboard_departamento(
    db: Session,
    admin: AdminDepartamento
) -> DashboardDepartamentoStats:
    
    if not admin.departamento_id:
        raise BadRequest(detail="Admin sin departamento asignado.")

    # 1. Obtener todos los informes (ACI) del departamento
    stmt = (
        select(ActividadCurricularInstancia)
        .join(Cursada)
        .join(Materia)
        .join(Materia.carreras)
        .where(Carrera.departamento_id == admin.departamento_id)
        .options(
            selectinload(ActividadCurricularInstancia.respuesta_sets)
            .selectinload(RespuestaSet.respuestas.of_type(RespuestaMultipleChoice))
            .selectinload(RespuestaMultipleChoice.opcion),
            selectinload(ActividadCurricularInstancia.respuesta_sets)
            .selectinload(RespuestaSet.respuestas.of_type(RespuestaRedaccion))
            .selectinload(RespuestaRedaccion.pregunta)
        )
    ).distinct()
    
    informes = db.scalars(stmt).all()
    
    # 2. Calcular Estado de Cumplimiento
    total = len(informes)
    pendientes = sum(1 for i in informes if i.estado == EstadoInforme.PENDIENTE)
    # Consideramos completados tanto los COMPLETADO como los RESUMIDO (ya procesados)
    completados = sum(1 for i in informes if i.estado in [EstadoInforme.COMPLETADO, EstadoInforme.RESUMIDO])

    # 3. Calcular Cobertura de Contenidos (Sección 2.A)
    # Inicializamos contadores para las 4 opciones conocidas
    conteo_cobertura = {
        "0% - 25%": 0,
        "26% - 50%": 0, 
        "51% - 75%": 0, 
        "76% - 100%": 0
    }
    
    necesidades = []

    for informe in informes:
        # Solo analizamos informes con respuestas
        if not informe.respuesta_sets: continue
        
        # Tomamos el set de respuestas más reciente
        rset = informe.respuesta_sets[-1] 
        
        for resp in rset.respuestas:
            # A. Detectar pregunta de Porcentaje (2.A)
            # Buscamos por texto parcial si no tenemos IDs fijos, o por tipo
            if isinstance(resp, RespuestaMultipleChoice) and resp.opcion:
                texto_opcion = resp.opcion.texto
                if texto_opcion in conteo_cobertura:
                    conteo_cobertura[texto_opcion] += 1
            
            # B. Detectar Necesidades (Sección 1)
            if isinstance(resp, RespuestaRedaccion) and resp.pregunta:
                # Filtramos por el texto de la pregunta de la Sección 1
                if "necesidades de equipamiento" in resp.pregunta.texto.lower() and resp.texto:
                    if len(resp.texto) > 5: # Ignorar respuestas vacías o muy cortas
                        materia = informe.cursada.materia.nombre if informe.cursada else "Desconocida"
                        necesidades.append(f"[{materia}] {resp.texto[:100]}...")

    # Formatear datos para el gráfico
    stats_cobertura = [
        StatDato(label=k, value=v) for k, v in conteo_cobertura.items()
    ]

    return DashboardDepartamentoStats(
        informes_total=total,
        informes_pendientes=pendientes,
        informes_completados=completados,
        cobertura_contenidos=stats_cobertura,
        necesidades_recientes=necesidades[:5] # Solo las 5 más recientes
    )

#para el pdf del informe sintetico
def obtener_informe_sintetico_respondido(
    db: Session, 
    informe_id: int,
    admin: AdminDepartamento
) -> schemas.InformeRespondido:
    
    # 1. Buscar la instancia
    instancia = db.get(InformeSinteticoInstancia, informe_id)
    if not instancia:
        raise NotFound(detail="Informe no encontrado")
    
    if instancia.departamento_id != admin.departamento_id:
        raise BadRequest(detail="No tiene permisos para ver este informe.")

    # 2. Buscar las respuestas (tomamos el último set de respuestas guardado)
    respuesta_set = db.query(RespuestaSet).filter(
        RespuestaSet.instrumento_instancia_id == informe_id
    ).order_by(RespuestaSet.created_at.desc()).first()

    # Mapa rápido de respuestas: { pregunta_id: "Texto de respuesta" }
    respuestas_map = {}
    if respuesta_set:
        for r in respuesta_set.respuestas:
            if isinstance(r, RespuestaRedaccion):
                respuestas_map[r.pregunta_id] = r.texto
            # Si hubiera multiple choice en el sintético, podrías agregarlo aquí

    # 3. Construir la estructura ordenada por secciones
    secciones_res = []
    # Usamos la plantilla asociada para mantener el orden correcto de preguntas
    plantilla = instancia.informe_sintetico
    
    # Cargar relaciones si no están cargadas (o confiar en lazy load si la sesión está abierta)
    # Para seguridad, mejor iteramos sobre lo que tenemos si la plantilla se cargó.
    # Si falla, habría que hacer un query con eager load, pero intentemos así primero.
    
    for sec in plantilla.secciones:
        pregs_res = []
        for preg in sec.preguntas:
            # Obtenemos el texto, si no hay respuesta ponemos un guion
            txt_resp = respuestas_map.get(preg.id, "Sin respuesta registrada.")
            pregs_res.append(schemas.PreguntaRespondida(
                pregunta_texto=preg.texto,
                respuesta_texto=txt_resp
            ))
        
        secciones_res.append(schemas.SeccionRespondida(
            seccion_nombre=sec.nombre,
            preguntas=pregs_res
        ))

    return schemas.InformeRespondido(
        titulo=plantilla.titulo,
        departamento=instancia.departamento.nombre if instancia.departamento else "Desconocido",
        fecha=instancia.fecha_inicio,
        secciones=secciones_res
    )