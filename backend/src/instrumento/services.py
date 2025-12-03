from datetime import datetime, timedelta
import collections
from typing import List, Optional
import unicodedata
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
            
            joinedload(ActividadCurricularInstancia.cursada)
            .selectinload(Cursada.inscripciones),
            
            joinedload(ActividadCurricularInstancia.profesor)
        )\
        .first()

    if not instancia:
        raise HTTPException(status_code=404, detail=f"Reporte {instancia_id} no encontrado.")
    
    if instancia.profesor_id != profesor_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para este reporte.")
    
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
    fecha_fin_informe: datetime,
    sintetico_existente: Optional[InformeSinteticoInstancia] = None # <--- PARÁMETRO NUEVO
) -> InformeSinteticoInstancia:
    
    departamento = db.get(Departamento, departamento_id)
    if not departamento:
        raise NotFound(detail=f"Departamento con ID {departamento_id} no encontrado.")
    
    anio_actual = datetime.now().year 

    # 1. Buscar informes de profesores que están "huérfanos" (no tienen sintético asignado)
    stmt_ac_completadas = (
        select(ActividadCurricularInstancia)
        .join(Cursada, ActividadCurricularInstancia.cursada_id == Cursada.id)
        .join(Cuatrimestre, Cursada.cuatrimestre_id == Cuatrimestre.id)
        .join(Materia, Cursada.materia_id == Materia.id)
        .join(carrera_materia_association, Materia.id == carrera_materia_association.c.materia_id)
        .join(Carrera, carrera_materia_association.c.carrera_id == Carrera.id)
        .where(
            Carrera.departamento_id == departamento_id,
            ActividadCurricularInstancia.estado == EstadoInforme.COMPLETADO,
            ActividadCurricularInstancia.informe_sintetico_instancia_id == None,
            Cuatrimestre.anio == anio_actual
        )
    ).distinct()
    
    informes_a_resumir: List[ActividadCurricularInstancia] = db.scalars(stmt_ac_completadas).all()

    # Si no hay nada nuevo que agregar:
    if not informes_a_resumir:
        if sintetico_existente:
            # Si ya existía uno y no hay nada nuevo, simplemente devolvemos el existente sin cambios
            return sintetico_existente
        # Si no existía y no hay nada, lanzamos error como antes
        raise NotFound(detail=f"No se encontraron informes para procesar.")

    print(f"Generando/Actualizando informe sintético para Depto. {departamento_id} con {len(informes_a_resumir)} nuevos informes.")
    
    instancia_destino = None

    # 2. Decidir si CREAR uno nuevo o USAR el existente
    if sintetico_existente:
        instancia_destino = sintetico_existente
        # Opcional: Actualizar fecha de modificación si quisieras
    else:
        # Lógica de creación original
        stmt_plantilla = select(InformeSintetico.id).where(
            InformeSintetico.estado == EstadoInstrumento.PUBLICADA,
            InformeSintetico.tipo == TipoInstrumento.INFORME_SINTETICO
        ).limit(1)
        
        plantilla_sintetico_id = db.scalars(stmt_plantilla).first()
        if not plantilla_sintetico_id:
            raise BadRequest(detail="No se encontró una plantilla de 'Informe Sintético' publicada.")

        instancia_destino = InformeSinteticoInstancia(
            informe_sintetico_id=plantilla_sintetico_id,
            departamento_id=departamento_id,
            tipo=TipoInstrumento.INFORME_SINTETICO,
            fecha_inicio=datetime.now(),     
            fecha_fin=fecha_fin_informe,
            estado=EstadoInforme.PENDIENTE 
        )
        db.add(instancia_destino)

    # 3. Asociar los informes huérfanos a la instancia destino (sea nueva o vieja)
    for informe_ac in informes_a_resumir:
        informe_ac.informe_sintetico_instancia = instancia_destino
        informe_ac.estado = EstadoInforme.RESUMIDO
        db.add(informe_ac)
        
    try:
        db.commit()
        db.refresh(instancia_destino)
    except Exception as e:
        db.rollback()
        raise BadRequest(detail=f"Error al guardar en BBDD: {e}")

    return instancia_destino


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
    materia_id: Optional[int] = None
) -> str:
    """
    Recorre los informes curriculares asociados al sintético.
    CORRECCIÓN: Filtros estrictos y excluyentes para evitar duplicación de contenido entre secciones.
    """
    instancia = db.query(models.InformeSinteticoInstancia).options(
        selectinload(models.InformeSinteticoInstancia.actividades_curriculares_instancia)
        .options(
            selectinload(models.ActividadCurricularInstancia.cursada).selectinload(Cursada.materia),
            selectinload(models.ActividadCurricularInstancia.cursada).selectinload(Cursada.profesor),
            selectinload(models.ActividadCurricularInstancia.cursada).selectinload(Cursada.inscripciones)
        )
    ).filter_by(id=instancia_sintetico_id).first()

    if not instancia:
        raise NotFound(detail="Instancia de informe sintético no encontrada")

    resumen_total = ""
    
    # Normalizamos la sección solicitada
    seccion_solicitada = normalize_text(numero_seccion).strip()
    if seccion_solicitada.endswith("."): seccion_solicitada = seccion_solicitada[:-1] 

    # --- LÓGICA DE FILTRADO ESTRICTO ---
    def es_pregunta_de_seccion(texto_pregunta: str, seccion: str) -> bool:
        t = normalize_text(texto_pregunta)
        
        if seccion == "0":
            # Solo comisiones, ignorar alumnos (ya se procesan aparte)
            return "comision" in t and ("teorica" in t or "practica" in t)
        
        if seccion == "1":
            return "equipamiento" in t or "bibliografia" in t or "insumo" in t
        
        if seccion == "2": # Solo horas
            return "horas" in t and "dictadas" in t
        
        if seccion == "2.a": # Solo contenidos/estrategias
            return "contenidos" in t or "estrategias" in t or "planificados" in t
        
        if seccion == "2.b": # Encuesta y Juicio
            # Excluir explícitamente aspectos positivos/obstáculos para no mezclar con 2.C
            es_encuesta = "encuesta" in t or "juicio" in t or "valor" in t
            es_2c = "aspecto" in t or "obstaculo" in t
            return es_encuesta and not es_2c
        
        if seccion == "2.c": # Aspectos positivos/obstáculos
            return "aspecto" in t or "obstaculo" in t or "positivo" in t
        
        if seccion == "3":
            return "actividad" in t or "investigacion" in t or "extension" in t or "gestion" in t
        
        if seccion == "4":
            return "auxiliar" in t or "desempeño" in t or "jtp" in t
        
        if seccion == "5":
            return "observacion" in t or "comentario" in t
            
        return False

    # Caso especial: Alumnos (Sección 0)
    busca_alumnos = "0" in seccion_solicitada and ("alumno" in numero_seccion.lower() or "inscripto" in numero_seccion.lower())
    if "alumno" in numero_seccion.lower() and "inscripto" in numero_seccion.lower():
        busca_alumnos = True

    for aci in instancia.actividades_curriculares_instancia:
        if not aci.cursada or not aci.cursada.materia: continue
        if materia_id and aci.cursada.materia.id != materia_id: continue
            
        materia_nombre = aci.cursada.materia.nombre

        # --- LÓGICA 1: DATOS AUTOMÁTICOS (ALUMNOS) ---
        if busca_alumnos:
            cantidad_real = len(aci.cursada.inscripciones)
            if not materia_id:
                resumen_total += f"• {materia_nombre}: {cantidad_real}\n"
            else:
                resumen_total = str(cantidad_real)
            continue 

        # --- LÓGICA 2: BÚSQUEDA CON FILTRO ---
        respuesta_set = db.query(RespuestaSet).filter_by(
            instrumento_instancia_id=aci.id
        ).order_by(RespuestaSet.created_at.desc()).first()

        if not respuesta_set: continue

        respuestas_encontradas = []
        
        for resp in respuesta_set.respuestas:
            if isinstance(resp, RespuestaRedaccion):
                # Usamos la función de filtrado estricto
                if es_pregunta_de_seccion(resp.pregunta.texto, seccion_solicitada):
                     if resp.texto:
                        respuestas_encontradas.append(resp.texto)

        if respuestas_encontradas:
            if not materia_id:
                resumen_total += f"• {materia_nombre}:\n"
            
            for txt in respuestas_encontradas:
                txt_limpio = txt.strip()
                if txt_limpio:
                    # Formato limpio: si ya tiene bullets, no agregamos otro nivel
                    if txt_limpio.startswith("•") or txt_limpio.startswith("-"):
                         resumen_total += f"{txt_limpio}\n"
                    else:
                         resumen_total += f"  - {txt_limpio}\n"
            
            if not materia_id:
                resumen_total += "\n"

    return resumen_total.strip()

def listar_informes_sinteticos_por_departamento(
    db: Session, 
    admin: AdminDepartamento
) -> List[schemas.InformeSinteticoInstanciaList]:
    
    if not admin.departamento_id:
        raise BadRequest(detail="El administrador no tiene un departamento asignado.")

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
    
    informe = db.get(models.InformeSinteticoInstancia, informe_id)
    if not informe:
        raise NotFound(detail="Informe sintético no encontrado.")
    
    if informe.departamento_id != admin.departamento_id:
        raise BadRequest(detail="No tiene permisos para ver este informe.")

    ids_encuestas_alumnos = []
    
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

    primera_encuesta = db.get(EncuestaInstancia, ids_encuestas_alumnos[0]) 
    
    if not primera_encuesta:
         raise NotFound(detail="No se encontró la encuesta base para generar estadísticas.")

    plantilla_encuesta = primera_encuesta.plantilla
    
    plantilla_full = db.query(Encuesta).options(
        selectinload(Encuesta.secciones)
        .selectinload(Seccion.preguntas.of_type(PreguntaMultipleChoice))
        .selectinload(PreguntaMultipleChoice.opciones)
    ).filter_by(id=plantilla_encuesta.id).first()

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
                resultados_por_pregunta=preguntas_seccion
            ))

    return encuestas_schemas.InformeSinteticoResultado(
        informe_id=informe.id,
        departamento_nombre=informe.departamento.nombre if informe.departamento else "Departamento",
        fecha_generacion=informe.fecha_inicio,
        cantidad_total_reportes=len(ids_encuestas_alumnos),
        resultados_por_seccion=resultados_secciones
    )

def obtener_dashboard_departamento(
    db: Session,
    admin: AdminDepartamento
) -> DashboardDepartamentoStats:
    
    if not admin.departamento_id:
        raise BadRequest(detail="Admin sin departamento asignado.")

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
    
    total = len(informes)
    pendientes = sum(1 for i in informes if i.estado == EstadoInforme.PENDIENTE)
    completados = sum(1 for i in informes if i.estado in [EstadoInforme.COMPLETADO, EstadoInforme.RESUMIDO])

    conteo_cobertura = {
        "0% - 25%": 0,
        "26% - 50%": 0, 
        "51% - 75%": 0, 
        "76% - 100%": 0
    }
    
    necesidades = []

    for informe in informes:
        if not informe.respuesta_sets: continue
        
        rset = informe.respuesta_sets[-1] 
        
        for resp in rset.respuestas:
            if isinstance(resp, RespuestaMultipleChoice) and resp.opcion:
                texto_opcion = resp.opcion.texto
                if texto_opcion in conteo_cobertura:
                    conteo_cobertura[texto_opcion] += 1
            
            if isinstance(resp, RespuestaRedaccion) and resp.pregunta:
                if "necesidades de equipamiento" in resp.pregunta.texto.lower() and resp.texto:
                    if len(resp.texto) > 5: 
                        materia = informe.cursada.materia.nombre if informe.cursada else "Desconocida"
                        necesidades.append(f"[{materia}] {resp.texto[:100]}...")

    stats_cobertura = [
        StatDato(label=k, value=v) for k, v in conteo_cobertura.items()
    ]

    return DashboardDepartamentoStats(
        informes_total=total,
        informes_pendientes=pendientes,
        informes_completados=completados,
        cobertura_contenidos=stats_cobertura,
        necesidades_recientes=necesidades[:5] 
    )

def normalize_text(text: str) -> str:
    if not text: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text) 
                   if unicodedata.category(c) != 'Mn').lower()

def obtener_informe_sintetico_respondido(
    db: Session, 
    informe_id: int,
    admin: AdminDepartamento
) -> schemas.InformeRespondido:
    
    # ... (búsqueda de instancia y respuesta_set igual que antes)
    instancia = db.get(models.InformeSinteticoInstancia, informe_id)
    if not instancia: raise NotFound(detail="Informe no encontrado")
    if instancia.departamento_id != admin.departamento_id: raise BadRequest(detail="No tiene permisos.")

    respuesta_set = db.query(RespuestaSet).filter(
        RespuestaSet.instrumento_instancia_id == informe_id
    ).order_by(RespuestaSet.created_at.desc()).first()

    respuestas_map = {}
    if respuesta_set:
        for r in respuesta_set.respuestas:
            if isinstance(r, RespuestaRedaccion):
                respuestas_map[r.pregunta_id] = r.texto

    secciones_res = []
    plantilla = instancia.informe_sintetico
    
    for sec in plantilla.secciones:
        pregs_res = []
        for preg in sec.preguntas:
            
            # --- FILTRO CORREGIDO ---
            t_norm = normalize_text(preg.texto)
            
            # Solo ocultamos del cuerpo si es la pregunta específica de la cabecera
            if "integrante" in t_norm and "comision" in t_norm:
                continue 
            
            # (Opcional) Si quieres ocultar la pregunta de "Observaciones... Comisión Asesora" del cuerpo
            # porque ya es la última sección, puedes dejar este también:
            # if "observaciones" in t_norm and "comision" in t_norm and "asesora" in t_norm:
            #    continue
            # ------------------------

            txt_resp = respuestas_map.get(preg.id, "Sin respuesta registrada.")
            pregs_res.append(schemas.PreguntaRespondida(
                pregunta_texto=preg.texto,
                respuesta_texto=txt_resp
            ))
        
        if pregs_res:
            secciones_res.append(schemas.SeccionRespondida(
                seccion_nombre=sec.nombre,
                preguntas=pregs_res
            ))

    return schemas.InformeRespondido(
        titulo=plantilla.titulo,
        departamento=instancia.departamento.nombre if instancia.departamento else "Desconocido",
        fecha=instancia.fecha_inicio,
        integrantes_comision=instancia.integrantes_comision, 
        secciones=secciones_res
    )

def obtener_informe_sintetico_con_detalles(db: Session, instancia_id: int) -> dict:

    instancia_sintetico = db.query(models.InformeSinteticoInstancia).options(
        joinedload(models.InformeSinteticoInstancia.departamento).joinedload(Departamento.sede)
    ).filter(models.InformeSinteticoInstancia.id == instancia_id).first()

    if not instancia_sintetico:
        raise NotFound(detail="Informe sintético no encontrado")

    plantilla = instancia_sintetico.informe_sintetico
    
    nombre_departamento = instancia_sintetico.departamento.nombre if instancia_sintetico.departamento else "Sin Departamento"
    nombre_sede = instancia_sintetico.departamento.sede.localidad if (instancia_sintetico.departamento and instancia_sintetico.departamento.sede) else "Sede Central"
    anio_ciclo = instancia_sintetico.fecha_inicio.year

    lista_asignaturas = []

    informes_hijos = db.query(ActividadCurricularInstancia).options(

        joinedload(ActividadCurricularInstancia.cursada).joinedload(Cursada.materia),
        joinedload(ActividadCurricularInstancia.profesor),
        selectinload(ActividadCurricularInstancia.respuesta_sets)
        .selectinload(RespuestaSet.respuestas)
        .joinedload(Respuesta.pregunta)
        
    ).filter(
        ActividadCurricularInstancia.informe_sintetico_instancia_id == instancia_id
    ).all()


    for informe in informes_hijos:

        ultimo_set = sorted(informe.respuesta_sets, key=lambda x: x.id)[-1] if informe.respuesta_sets else None
        
        respuestas_procesadas = []
        if ultimo_set:
            for r in ultimo_set.respuestas:

                texto = getattr(r, 'texto', None)
                
                opcion_texto = None
                if hasattr(r, 'opcion') and r.opcion:
                     opcion_texto = r.opcion.texto

                pregunta_texto = ""
                if r.pregunta:
                    pregunta_texto = r.pregunta.texto  
                
                respuestas_procesadas.append({
                    "pregunta_id": r.pregunta_id,
                    "pregunta_texto": pregunta_texto, 
                    "texto": texto,
                    "opcion_texto": opcion_texto 
                })

        lista_asignaturas.append({
            "id": informe.id,
            "materia_nombre": informe.cursada.materia.nombre if informe.cursada else "Desconocida",
            # --- AGREGAR ESTA LÍNEA ---
            "materia_id": informe.cursada.materia.id if informe.cursada and informe.cursada.materia else 0,
            # --------------------------
            "docente_nombre": informe.profesor.nombre if informe.profesor else "Sin docente",
            "respuestas": respuestas_procesadas
        })

    return {
        "id": instancia_sintetico.id,
        "titulo": plantilla.titulo if plantilla else "Informe Sintético",
        "descripcion": plantilla.descripcion if plantilla else "",
        "sede": nombre_sede,
        "anio": anio_ciclo,
        "departamento": nombre_departamento,
        "informes_asignaturas": lista_asignaturas
    }
def procesar_vencimiento_informes_profesores(db: Session):

    now = datetime.now()
    
    # Buscar informes vencidos
    stmt_vencidos = select(ActividadCurricularInstancia).join(Cursada).join(Materia).join(carrera_materia_association).join(Carrera).where(
        ActividadCurricularInstancia.estado == EstadoInforme.PENDIENTE,
        ActividadCurricularInstancia.fecha_fin != None,
        ActividadCurricularInstancia.fecha_fin <= now
    )
    
    informes_vencidos = db.scalars(stmt_vencidos).all()
    
    if not informes_vencidos:
        return # Nada que hacer
    
    deptos_afectados = set()
    
    # Cerrar informes
    for informe in informes_vencidos:
        print(f"🔴 [AUTO] Cerrando Informe Profesor ID {informe.id} (Vencido)")
        informe.estado = EstadoInforme.COMPLETADO
        db.add(informe)
        
        if informe.cursada and informe.cursada.materia and informe.cursada.materia.carreras:
            depto_id = informe.cursada.materia.carreras[0].departamento_id
            deptos_afectados.add(depto_id)
            
    db.commit() # Guardar cierres
    
    fecha_cierre_sintetico = now + timedelta(days=7)
    
    for depto_id in deptos_afectados:
        try:

            stmt_sintetico_existente = select(InformeSinteticoInstancia).where(
                InformeSinteticoInstancia.departamento_id == depto_id,
                InformeSinteticoInstancia.estado == EstadoInforme.PENDIENTE
            )
            sintetico_existente = db.scalars(stmt_sintetico_existente).first()
            
            if sintetico_existente:
                print(f"🔵 [AUTO] Actualizando Informe Sintético existente (ID: {sintetico_existente.id}) para Depto {depto_id}")

                generar_informe_sintetico_para_departamento(
                    db, 
                    depto_id, 
                    fecha_cierre_sintetico,
                    sintetico_existente=sintetico_existente 
                )

            else:
                print(f"fq [AUTO] Abriendo NUEVO Informe Sintético para Depto {depto_id}")
                generar_informe_sintetico_para_departamento(
                    db, 
                    depto_id, 
                    fecha_cierre_sintetico,
                    sintetico_existente=None # Explícitamente None
                )
                
        except Exception as e:
            print(f"⚠️ Error generando sintético automático para Depto {depto_id}: {e}")