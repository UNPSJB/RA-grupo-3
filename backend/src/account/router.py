from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from src.database import get_db
from src.dependencies import get_current_user # ¡Usamos nuestra dependencia real!
from src.persona.models import Persona
from src.auth.services import verify_password, get_password_hash # Importa tus helpers de auth
from src.exceptions import BadRequest

router = APIRouter(prefix="/account", tags=["Account"])

# --- Schema para los datos que esperamos del frontend ---
class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_user_password(
    data: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_user)
):
    """
    Permite a CUALQUIER usuario autenticado (Alumno, Docente, Admin)
    cambiar su propia contraseña.
    """
    
    # 1. Verificar que la contraseña actual sea correcta
    if not verify_password(data.current_password, current_user.hashed_password):
        raise BadRequest(detail="La contraseña actual es incorrecta.")
    
    # 2. (Opcional) Verificar que la nueva no sea igual a la vieja
    if data.new_password == data.current_password:
         raise BadRequest(detail="La nueva contraseña no puede ser igual a la actual.")

    # 3. Hashear y guardar la nueva contraseña
    current_user.hashed_password = get_password_hash(data.new_password)
    
    db.add(current_user)
    db.commit()
    
    return {"message": "Contraseña cambiada exitosamente."}