from src.alumnos.constants import ErrorCode
from src.alumnos.exceptions import NotFound, BadRequest

class AlumnoNoEncontrado(NotFound):
    DETAIL = ErrorCode.ALUMNO_NO_ENCONTRADO_NO_ENCONTRADA

class EmailDuplicado(BadRequest):
    DETAIL = ErrorCode.EMAIL_DUPLICADO


class NombreDuplicado(BadRequest):
    DETAIL = ErrorCode.NOMBRE_DUPLICADO


