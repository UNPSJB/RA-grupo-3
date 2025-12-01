from enum import StrEnum

class CicloMateria(StrEnum):
     BASICO = "basico"
     SUPERIOR = "superior"

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
    RESUMIDO = "resumido" 

class EstadoInstrumento(StrEnum):
        BORRADOR = "borrador"
        PUBLICADA = "publicada"
        

class TipoPersona(StrEnum):
    ALUMNO = "ALUMNO"
    DOCENTE = "DOCENTE"
    ADMIN_DEPARTAMENTO = "ADMIN_DEPARTAMENTO" 
    ADMIN_SECRETARIA = "ADMIN_SECRETARIA"     

class TipoPregunta(StrEnum):
    REDACCION = "REDACCION"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"

class TipoInstrumento(StrEnum):
    ENCUESTA = "ENCUESTA"
    ACTIVIDAD_CURRICULAR = "ACTIVIDAD_CURRICULAR"
    INFORME_SINTETICO = "INFORME_SINTETICO"