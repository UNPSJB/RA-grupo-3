from __future__ import annotations

from typing import List

from sqlalchemy import Enum as SQLAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enumerados import TipoPreguntaEnum
from src.models import ModeloBase


class Pregunta(ModeloBase):
    __tablename__ = "preguntas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)
    tipo: Mapped[TipoPreguntaEnum] = mapped_column(
        SQLAEnum(TipoPreguntaEnum, name="tipo_pregunta", native_enum=False),
        nullable=False,
    )
    seccion_id: Mapped[int] = mapped_column(
        ForeignKey("secciones.id"), nullable=False
    )

    seccion: Mapped["Seccion"] = relationship(
        "Seccion", back_populates="preguntas"
    )
    opciones: Mapped[List["Opcion"]] = relationship(
        "Opcion", back_populates="pregunta", cascade="all, delete-orphan"
    )
    respuestas: Mapped[List["Respuesta"]] = relationship(
        "Respuesta", back_populates="pregunta"
    )

    def __repr__(self) -> str:  # pragma: no cover - diagnóstico
        return (
            f"<Pregunta id={self.id} tipo={self.tipo.value} "
            f"seccion_id={self.seccion_id}>"
        )


class Opcion(ModeloBase):
    __tablename__ = "opciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(255), nullable=False)
    pregunta_id: Mapped[int] = mapped_column(
        ForeignKey("preguntas.id"), nullable=False
    )

    pregunta: Mapped[Pregunta] = relationship(
        Pregunta, back_populates="opciones"
    )

    def __repr__(self) -> str:  # pragma: no cover - diagnóstico
        return (
            f"<Opcion id={self.id} pregunta_id={self.pregunta_id} "
            f"texto={self.texto!r}>"
        )
