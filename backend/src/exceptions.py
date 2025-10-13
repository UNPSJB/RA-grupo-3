from typing import Any

from fastapi import HTTPException, status


class DetailedHTTPException(HTTPException):
    STATUS_CODE = status.HTTP_500_INTERNAL_SERVER_ERROR
    DETAIL = "Error en el servidor"

    def __init__(self, **kwargs: Any) -> None:
        # Usar los atributos de clase si no se proporcionan en kwargs
        status_code = kwargs.pop('status_code', self.STATUS_CODE)
        detail = kwargs.pop('detail', self.DETAIL)
        super().__init__(status_code=status_code, detail=detail, **kwargs)


class PermissionDenied(DetailedHTTPException):
    STATUS_CODE = status.HTTP_403_FORBIDDEN
    DETAIL = "Permiso denegado"


class NotFound(DetailedHTTPException):
    STATUS_CODE = status.HTTP_404_NOT_FOUND
    DETAIL = "No encontrado"


class BadRequest(DetailedHTTPException):
    STATUS_CODE = status.HTTP_400_BAD_REQUEST
    DETAIL = "Solicitud incorrecta"


class UnprocessableEntity(DetailedHTTPException):
    STATUS_CODE = status.HTTP_422_UNPROCESSABLE_ENTITY
    DETAIL = "Entidad no procesable"


class NotAuthenticated(DetailedHTTPException):
    STATUS_CODE = status.HTTP_401_UNAUTHORIZED
    DETAIL = "Usuario no autorizado"

    def __init__(self, **kwargs: Any) -> None:
        headers = kwargs.pop('headers', {})
        headers.setdefault('WWW-Authenticate', 'Bearer')
        super().__init__(headers=headers, **kwargs)
