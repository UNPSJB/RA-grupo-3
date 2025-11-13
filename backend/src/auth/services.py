from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from src.persona.models import Persona
from sqlalchemy.orm import Session

# --- Configuración ---
SECRET_KEY = "TU_SECRET_KEY_SUPER_SECRETA" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Funciones de Utilidad ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str) -> Optional[Persona]:
    user = db.query(Persona).filter(Persona.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user