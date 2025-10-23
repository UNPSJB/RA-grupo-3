from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from src.models import ModeloBase


class Respuesta(ModeloBase):
    __tablename__ = "respuestas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    opcion_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("opciones.id"), nullable=True
    )
    pregunta_id: Mapped[int] = mapped_column(
        ForeignKey("preguntas.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    pregunta: Mapped["Pregunta"] = relationship(
        "Pregunta", back_populates="respuestas"
    )
    opcion: Mapped[Optional["Opcion"]] = relationship("Opcion")

    def __repr__(self) -> str:  # pragma: no cover - diagnóstico
        return (
            f"<Respuesta id={self.id} pregunta_id={self.pregunta_id} "
            f"opcion_id={self.opcion_id}>"
        )
