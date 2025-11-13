from enum import StrEnum

class TipoCuatrimestre(StrEnum):
        PRIMERO = "primero"
        SEGUNDO = "segundo"
        ANUAL = "anual"

class EstadoInstancia(StrEnum):
    PENDIENTE = "pendiente" # Creada, pero aún no en fecha_inicio
    ACTIVA = "activa"     # Alumnos pueden responder
    CERRADA = "cerrada"   # Ya pasó fecha_fin, se pueden ver resultados

class EstadoInforme(StrEnum):
    PENDIENTE = "pendiente"
    COMPLETADO = "completado"

class EstadoInstrumento(StrEnum):
        BORRADOR = "borrador"
        PUBLICADA = "publicada"

class TipoPersona(StrEnum):
    ALUMNO = "ALUMNO"
    DOCENTE = "DOCENTE"
    ADMIN_SECRETARIA = "ADMIN_SECRETARIA"
    ADMIN_DEPARTAMENTO = "ADMIN_DEPARTAMENTO"

class TipoPregunta(StrEnum):
    REDACCION = "REDACCION"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"

class TipoInstrumento(StrEnum):
    ENCUESTA = "ENCUESTA"
    ACTIVIDAD_CURRICULAR = "ACTIVIDAD_CURRICULAR"
    INFORME_SINTETICO = "INFORME_SINTETICO"
