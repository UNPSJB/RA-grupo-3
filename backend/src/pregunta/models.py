# src/Pregunta/models.py
from __future__ import annotations
from typing import List, Optional
from sqlalchemy import Integer, String, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
import enum
from src.encuestas.models import Encuesta

class TipoPregunta(enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    REDACCION = "REDACCION"


class Pregunta(ModeloBase):
    __tablename__ = "preguntas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)
    tipo: Mapped[TipoPregunta] = mapped_column(Enum(TipoPregunta), nullable=False)
    #encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"))

    # Relación con seccion
    seccion_id: Mapped[int] = mapped_column(ForeignKey("secciones.id"), nullable=True)
    seccion: Mapped[Optional["Seccion"]] = relationship("Seccion", back_populates="preguntas")
    
    # Relaciones
    opciones: Mapped[List["Opcion"]] = relationship(
        "Opcion", back_populates="pregunta", cascade="all, delete-orphan"
    )

    respuestas: Mapped["Respuesta"] = relationship(
        "Respuesta", back_populates="pregunta"
    )

class Opcion(ModeloBase):
    __tablename__ = "opciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(255), nullable=False)
    pregunta_id: Mapped[int] = mapped_column(ForeignKey("preguntas.id"), nullable=False)
    
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="opciones")
    respuestas: Mapped[List["Respuesta"]] = relationship(
        "Respuesta", back_populates="opcion"
    )