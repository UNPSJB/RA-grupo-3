from __future__ import annotations
from typing import Optional, List
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase


class Seccion(ModeloBase):
    __tablename__ = "secciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"))
    encuesta: Mapped["Encuesta"] = relationship("Encuesta", back_populates="secciones")
    preguntas: Mapped[Optional[List["Pregunta"]]] = relationship(
        "Pregunta",
        back_populates="seccion",
        cascade="all, delete-orphan"
    )
