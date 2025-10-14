from typing import List
from src.seccion.constants import ErrorCode
from src.exceptions import NotFound, BadRequest

class SeccionNoEncontrada(NotFound):
    DETAIL = ErrorCode.SECCION_NO_ENCONTRADA

class SeccionDuplicada(BadRequest):
    DETAIL = ErrorCode.SECCION_DUPLICADA

