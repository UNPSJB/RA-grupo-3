from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from src.database import get_db


# --- Importa los nuevos modelos Admin ---
from src.persona.models import (
    Alumno, 
    Profesor, 
    Persona, 
    TipoPersona, 
    AdminSecretaria, 
    AdminDepartamento
)
from src.auth.services import SECRET_KEY, ALGORITHM
from src.exceptions import NotAuthenticated, PermissionDenied

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> Persona:
    """
    Dependencia principal: decodifica el token JWT, 
    encuentra al usuario en la BBDD y lo devuelve.
    """
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
    """
    DEPENDENCIA REAL: obtiene el usuario logueado y verifica 
    que sea un Alumno.
    """
    if current_user.tipo != TipoPersona.ALUMNO:
        raise PermissionDenied(detail="No tienes permisos de Alumno")
    return current_user


async def get_current_profesor(
        current_user: Persona = Depends(get_current_user)
)-> Profesor:
    """
    DEPENDENCIA REAL: este obtiene un usuario y verifica 
    que sea profesor
    """
    if current_user.tipo != TipoPersona.DOCENTE:
        raise PermissionDenied(detail="No tienes permisos de profesor")
    return current_user

# --- Guardia para Admin de Departamento ---
async def get_current_admin_departamento(
        current_user: Persona = Depends(get_current_user)
)-> AdminDepartamento:
    """
    DEPENDENCIA REAL: verifica que sea un Admin de Departamento.
    """
    if current_user.tipo != TipoPersona.ADMIN_DEPARTAMENTO:
        raise PermissionDenied(detail="No tienes permisos de Administrador de Departamento")
    return current_user

# --- Guardia para Admin de Secretaría (para el futuro) ---
async def get_current_admin_secretaria(
        current_user: Persona = Depends(get_current_user)
)-> AdminSecretaria:
    """
    DEPENDENCIA REAL: verifica que sea un Admin de Secretaría.
    """
    if current_user.tipo != TipoPersona.ADMIN_SECRETARIA:
        raise PermissionDenied(detail="No tienes permisos de Administrador de Secretaría")
    return current_user

# --- Nueva Guardia para Roles Mixtos (Departamento O Secretaría) ---
async def get_current_admin_departamento_o_secretaria(
        current_user: Persona = Depends(get_current_user)
) -> Persona:
    """
    DEPENDENCIA REAL: verifica que sea un Admin de Departamento O de Secretaría.
    Devuelve el objeto Persona para mayor flexibilidad.
    """
    if current_user.tipo not in [TipoPersona.ADMIN_DEPARTAMENTO, TipoPersona.ADMIN_SECRETARIA]:
        raise PermissionDenied(
            detail="Se requieren permisos de Administrador de Departamento o Secretaría"
        )
    # Devolvemos el usuario, ya que ambos roles son válidos
    return current_user