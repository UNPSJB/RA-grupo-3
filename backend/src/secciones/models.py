from __future__ import annotations

from typing import List

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models import ModeloBase


class Seccion(ModeloBase):
    __tablename__ = "secciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    encuesta_id: Mapped[int] = mapped_column(
        ForeignKey("encuesta.id"), nullable=False
    )
    encuesta: Mapped["Encuesta"] = relationship(
        "Encuesta", back_populates="secciones"
    )

    preguntas: Mapped[List["Pregunta"]] = relationship(
        "Pregunta", back_populates="seccion", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - diagnóstico
        return (
            f"<Seccion id={self.id} nombre={self.nombre!r} "
            f"encuesta_id={self.encuesta_id}>"
        )
