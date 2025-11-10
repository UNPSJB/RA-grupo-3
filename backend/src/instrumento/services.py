from sqlalchemy.orm import Session, selectinload
from src.instrumento import models, schemas
from src.enumerados import TipoInstrumento,EstadoInstrumento,EstadoInforme
from src.encuestas.models import Encuesta
from typing import List
from sqlalchemy import select
from fastapi import HTTPException
from src.seccion.models import Seccion
from src.instrumento.models import ActividadCurricularInstancia
from src.pregunta.models import Pregunta, PreguntaMultipleChoice

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