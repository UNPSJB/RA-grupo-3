from __future__ import annotations
from typing import List, Optional

from src.seccion.models import Seccion
from sqlalchemy import Integer, String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
import enum


class TipoPregunta(enum.StrEnum):
    REDACCION = "REDACCION"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"



class Pregunta(ModeloBase):
    __tablename__ = "preguntas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relación con seccion
    seccion_id: Mapped[int] = mapped_column(ForeignKey("secciones.id"), nullable=True)
    seccion: Mapped[Optional["Seccion"]] = relationship("Seccion", back_populates="preguntas")
<<<<<<< HEAD
    respuestas = relationship("Respuesta", back_populates="pregunta")
    
    # Relaciones
    opciones: Mapped[List["Opcion"]] = relationship(
        "Opcion", back_populates="pregunta", cascade="all, delete-orphan"
    )
=======
>>>>>>> main

    tipo: Mapped[TipoPregunta] = mapped_column(
        Enum(TipoPregunta), nullable=False
    )
    respuestas: Mapped[List["Respuesta"]] = relationship(
        "Respuesta", back_populates="pregunta"
    )
    __mapper_args__ = {
        "polymorphic_on": "tipo", # Le dice que use la columna 'tipo'
    }

class PreguntaRedaccion(Pregunta):
    __tablename__= "pregunta_redaccion"
    id: Mapped[int] = mapped_column(ForeignKey("preguntas.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoPregunta.REDACCION,
    }


class PreguntaMultipleChoice(Pregunta):
    __tablename__ = "pregunta_multiple_choice"
    
    id: Mapped[int] = mapped_column(ForeignKey("preguntas.id"), primary_key=True)
    
    opciones: Mapped[List["Opcion"]] = relationship(
        "Opcion", 
        back_populates="pregunta",
        cascade="all, delete-orphan"
    )

    __mapper_args__ = {
        "polymorphic_identity": TipoPregunta.MULTIPLE_CHOICE,
    }


class Opcion(ModeloBase):
    __tablename__ = "opciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(255), nullable=False)
    pregunta_id: Mapped[int] = mapped_column(
        ForeignKey("pregunta_multiple_choice.id"), nullable=False
    )

    pregunta: Mapped["PreguntaMultipleChoice"] = relationship(
        "PreguntaMultipleChoice", 
        back_populates="opciones"
    )
    
    respuestas: Mapped[List["RespuestaMultipleChoice"]] = relationship(
        "RespuestaMultipleChoice", back_populates="opcion"
    )