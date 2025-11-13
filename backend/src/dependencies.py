from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from src.database import get_db
from src.persona.models import Alumno, Profesor, Persona, TipoPersona
from src.auth.services import SECRET_KEY, ALGORITHM # Importa desde tu auth.py
from src.exceptions import NotAuthenticated, PermissionDenied

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> Persona:
    credentials_exception = NotAuthenticated(
        detail="no se pueden validar las credenciales"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(Persona).filter(Persona.username == username).first()
    if user is None:
        raise credentials_exception
    return user 

async def get_current_alumno(
        current_user: Persona = Depends(get_current_user)
) -> Alumno:
    "DEPENDENCIA REAL: obtiene el usuario logueado y verifica que sea un Alumno"
    if current_user.tipo != TipoPersona.ALUMNO:
        raise PermissionDenied(detail="No tienes permisos de Alumno")
    return current_user


async def get_current_profesor(
        current_user: Persona = Depends(get_current_user)
)-> Profesor:
    # DEPENDENCIA REAL: este obtiene un usuario y verifica que sea profesor
    if current_user.tipo != TipoPersona.DOCENTE:
        raise PermissionDenied(detail="No tienes permisos de profesor")
    return current_user

#  TODO CREAR EL GET CURRENT ADMIN PARA DEPARTAMENTO



async def get_current_alumno(db: Session = Depends(get_db)) -> Alumno:
    """
    DEPENDENCY SIMULADA: Siempre devuelve el mismo alumno de prueba.
    """
    # Asume que tienes un Alumno con ID=2 en tu base de datos para pruebas.
    test_alumno_id = 2
    
    alumno = db.get(Alumno, test_alumno_id) # Busca el alumno de prueba en la BD
    
    if not alumno:
        raise HTTPException(
            status_code=500, # Error interno del servidor
            detail=f"Alumno de prueba con ID {test_alumno_id} no encontrado. Asegúrate de crearlo en la base de datos."
        )
        
    # Devuelve el objeto Alumno encontrado
    return alumno
async def get_current_profesor(db: Session = Depends(get_db)) -> Profesor:
    """
    DEPENDENCY SIMULADA: Siempre devuelve el mismo profesor de prueba.
    """
    # Asume que tienes un Alumno con ID=2 en tu base de datos para pruebas.
    test_alumno_id = 2
    
    alumno = db.get(Alumno, test_alumno_id) # Busca el alumno de prueba en la BD
    
    if not alumno:
        raise HTTPException(
            status_code=500, # Error interno del servidor
            detail=f"Alumno de prueba con ID {test_alumno_id} no encontrado. Asegúrate de crearlo en la base de datos."
        )
        
    # Devuelve el objeto Alumno encontrado
    return alumno

async def get_current_profesor(db: Session = Depends(get_db)) -> Profesor:
    test_profesor_id = 1 # El ID que creó seed_data
    profesor = db.get(Profesor, test_profesor_id)
    if not profesor:
        raise HTTPException(
            status_code=500,
            detail=f"Profesor de prueba con ID {test_profesor_id} no encontrado. Ejecuta seed_data.py."
        )
    return profesor