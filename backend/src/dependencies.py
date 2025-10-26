from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.persona.models import Alumno

async def get_current_alumno(db: Session = Depends(get_db)) -> Alumno:
    """
    DEPENDENCY SIMULADA: Siempre devuelve el mismo alumno de prueba.
    """
    # Asume que tienes un Alumno con ID=1 en tu base de datos para pruebas.
    test_alumno_id = 2
    
    alumno = db.get(Alumno, test_alumno_id) # Busca el alumno de prueba en la BD
    
    if not alumno:
        raise HTTPException(
            status_code=500, # Error interno del servidor
            detail=f"Alumno de prueba con ID {test_alumno_id} no encontrado. Asegúrate de crearlo en la base de datos."
        )
        
    # Devuelve el objeto Alumno encontrado
    return alumno