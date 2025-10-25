from enum import StrEnum

class TipoCuatrimestre(StrEnum):
        PRIMERO = "primero"
        SEGUNDO = "segundo"
        ANUAL = "anual"


class EstadoInstancia(StrEnum):
    PENDIENTE = "pendiente" # Creada, pero aún no en fecha_inicio
    ACTIVA = "activa"     # Alumnos pueden responder
    CERRADA = "cerrada"   # Ya pasó fecha_fin, se pueden ver resultados


class EstadoEncuesta(StrEnum):
        BORRADOR = "borrador"
        PUBLICADA = "publicada"

class TipoPersona(StrEnum):
    ALUMNO = "ALUMNO"
    DOCENTE = "DOCENTE"
