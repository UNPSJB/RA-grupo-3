from sqlalchemy.orm import Session
from src.instrumento import models, schemas
from src.enumerados import TipoInstrumento
from src.encuestas import models as encuesta_models

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
            db_plantilla = encuesta_models.Encuesta(**datos_base)
        
        case TipoInstrumento.ACTIVIDAD_CURRICULAR:
            db_plantilla = models.ActividadCurricularPlantilla(**datos_base)

        case TipoInstrumento.INFORME_SINTETICO:
            db_plantilla = models.InformeSinteticoPlantilla(**datos_base)
        
        case _:
            raise ValueError("Tipo de instrumento no válido")

    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    
    return db_plantilla