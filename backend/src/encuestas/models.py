from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLAEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from src.enumerados import EstadoEncuestaEnum, TipoCursadaEnum
from src.models import ModeloBase


class Encuesta(ModeloBase):
    __tablename__ = "encuesta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str] = mapped_column(String, nullable=False)
    anio_carrera: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cursada: Mapped[TipoCursadaEnum] = mapped_column(
        SQLAEnum(TipoCursadaEnum, name="tipo_cursada", native_enum=False),
        nullable=False,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    fecha_fin: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    esta_completa: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="0", nullable=False
    )
    estado: Mapped[EstadoEncuestaEnum] = mapped_column(
        SQLAEnum(EstadoEncuestaEnum, name="estado_encuesta", native_enum=False),
        nullable=False,
        default=EstadoEncuestaEnum.BORRADOR,
        server_default=EstadoEncuestaEnum.BORRADOR.value,
    )

    secciones: Mapped[List["Seccion"]] = relationship(
        "Seccion",
        back_populates="encuesta",
        cascade="all, delete-orphan",
    )

    def to_frontend_estado(self) -> str:
        """Convierte el estado interno al formato esperado por el frontend."""
        return (
            "publicadas"
            if self.estado == EstadoEncuestaEnum.PUBLICADA
            else "borradores"
        )

    def __repr__(self) -> str:  # pragma: no cover - solo diagnóstico
        return (
            f"<Encuesta id={self.id} titulo={self.titulo!r} "
            f"estado={self.estado.value}>"
        )
