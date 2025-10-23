import enum


class TipoCursadaEnum(str, enum.Enum):
    PRIMERO = "primero"
    SEGUNDO = "segundo"
    ANUAL = "anual"


class EstadoEncuestaEnum(str, enum.Enum):
    BORRADOR = "borrador"
    PUBLICADA = "publicada"


class TipoPreguntaEnum(str, enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    REDACCION = "REDACCION"
