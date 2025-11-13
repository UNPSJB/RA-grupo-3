from enum import StrEnum

class TipoCuatrimestre(StrEnum):
        PRIMERO = "primero"
        SEGUNDO = "segundo"
        ANUAL = "anual"

class EstadoInstancia(StrEnum):
    PENDIENTE = "pendiente"
    ACTIVA = "activa"
    CERRADA = "cerrada"

class EstadoInforme(StrEnum):
    PENDIENTE = "pendiente"
    COMPLETADO = "completado"

class EstadoInstrumento(StrEnum):
        BORRADOR = "borrador"
        PUBLICADA = "publicada"

class TipoPersona(StrEnum):
    ALUMNO = "ALUMNO"
    DOCENTE = "DOCENTE"
    ADMIN_DEPARTAMENTO = "ADMIN_DEPARTAMENTO" # Rol principal de admin
    ADMIN_SECRETARIA = "ADMIN_SECRETARIA"     # Rol futuro

class TipoPregunta(StrEnum):
    REDACCION = "REDACCION"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"

class TipoInstrumento(StrEnum):
    ENCUESTA = "ENCUESTA"
    ACTIVIDAD_CURRICULAR = "ACTIVIDAD_CURRICULAR"
    INFORME_SINTETICO = "INFORME_SINTETICO"