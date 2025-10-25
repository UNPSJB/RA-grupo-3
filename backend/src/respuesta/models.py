from __future__ import annotations
from sqlalchemy import Integer, String, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from src.models import ModeloBase
from sqlalchemy import Column, DateTime, func

from src.pregunta.models import Pregunta, Opcion, TipoPregunta
#from src.encuestas.models import EncuestaInstancia

class RespuestaSet(ModeloBase):
    __tablename__ = "respuesta_set"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # A qué EncuestaInstancia pertenece (N-a-1)
    encuesta_instancia_id: Mapped[int] = mapped_column(
        ForeignKey("encuesta_instancia.id"), nullable=False
    )
    encuesta_instancia: Mapped["EncuestaInstancia"] = relationship(
        "EncuestaInstancia", back_populates="respuesta_sets"
    )

    # Qué Respuestas contiene (1-a-N)
    respuestas: Mapped[List["Respuesta"]] = relationship(
        back_populates="respuesta_set", cascade="all, delete-orphan"
    )


class Respuesta(ModeloBase):
    __tablename__ = "respuestas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # A qué Pregunta (base) corresponde (N-a-1)
    pregunta_id: Mapped[int] = mapped_column(ForeignKey("preguntas.id"), nullable=False)
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="respuestas")

    # A qué "sobre" pertenece (N-a-1)
    respuesta_set_id: Mapped[int] = mapped_column(ForeignKey("respuesta_set.id"), nullable=False)
    respuesta_set: Mapped["RespuestaSet"] = relationship("RespuestaSet", back_populates="respuestas")

    # Columna Discriminadora (usa el mismo Enum que Pregunta)
    tipo: Mapped[TipoPregunta] = mapped_column(Enum(TipoPregunta), nullable=False)

    # Configuración de Herencia
    __mapper_args__ = {
        "polymorphic_on": "tipo",
    }


class RespuestaRedaccion(Respuesta):
    __tablename__ = "respuesta_redaccion"

    # Une a la tabla base 'respuestas'
    id: Mapped[int] = mapped_column(ForeignKey("respuestas.id"), primary_key=True)
    # Dato específico: el texto
    texto: Mapped[str] = mapped_column(Text, nullable=False)

    # Configuración de Herencia
    __mapper_args__ = {
        "polymorphic_identity": TipoPregunta.REDACCION,
    }

class RespuestaMultipleChoice(Respuesta):
    __tablename__ = "respuesta_multiple_choice"

    
    id: Mapped[int] = mapped_column(ForeignKey("respuestas.id"), primary_key=True)

    # Dato específico: la opción elegida (N-a-1)
    opcion_id: Mapped[int] = mapped_column(ForeignKey("opciones.id"), nullable=False)
    opcion: Mapped["Opcion"] = relationship("Opcion", back_populates="respuestas")

    # Configuración de Herencia
    __mapper_args__ = {
        "polymorphic_identity": TipoPregunta.MULTIPLE_CHOICE,
    }