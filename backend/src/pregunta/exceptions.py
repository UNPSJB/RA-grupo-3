from src.pregunta.constants import ErrorCode

class NotFound(Exception):
    DETAIL = "Recurso no encontrado"

    def __init__(self, detail: str = None):
        if detail:
            self.DETAIL = detail
        super().__init__(self.DETAIL)


class BadRequest(Exception):
    DETAIL = "Petición inválida"

    def __init__(self, detail: str = None):
        if detail:
            self.DETAIL = detail
        super().__init__(self.DETAIL)


class PreguntaNoEncontrada(NotFound):
    DETAIL = ErrorCode.PREGUNTA_NO_ENCONTRADA
