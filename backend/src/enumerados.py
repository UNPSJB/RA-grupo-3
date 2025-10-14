from enum import StrEnum

class TipoCuatrimestre(StrEnum):
        PRIMERO = "primero"
        SEGUNDO = "segundo"
        ANUAL = "anual"


class EstadoEncuesta(StrEnum):
        BORRADOR = "borador"
        PUBLICADA = "publicada"
