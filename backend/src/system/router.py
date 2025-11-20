from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/system", tags=["Sistema"])

@router.get("/time")
def get_server_time():
    """Devuelve la fecha y hora actual del servidor."""
    return {"server_time": datetime.now().isoformat()}