from __future__ import annotations
from datetime import datetime
from typing import List
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import EstadoInstancia, TipoInstrumento
from src.instrumento.models import ActividadCurricularInstancia, InstrumentoBase, InstrumentoInstancia

class Encuesta(InstrumentoBase):
    __tablename__ = "encuesta" #cambio de nombre a encuesta singular por un tema de buenas practicas

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_base.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.ENCUESTA,
    }

    # estados de la encuesta
    instancias: Mapped[List["EncuestaInstancia"]] = relationship(
        back_populates="encuesta", cascade="all, delete-orphan"
    )


class EncuestaInstancia(InstrumentoInstancia):
    __tablename__ = "encuesta_instancia"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_instancia.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.ENCUESTA,
    }
    estado: Mapped[EstadoInstancia] = mapped_column(
        SQLEnum(EstadoInstancia, name="estado_instancia_enum"), default=EstadoInstancia.PENDIENTE
    )

    cursada_id: Mapped[int] = mapped_column(ForeignKey("cursada.id"), unique=True, nullable=False)
    cursada: Mapped["Cursada"] = relationship(back_populates="encuesta_instancia")

    encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"), nullable=False)

    encuesta: Mapped["Encuesta"] = relationship(back_populates="instancias")

    actividad_curricular_instancia: Mapped["ActividadCurricularInstancia"] = relationship(
        back_populates="encuesta_instancia", uselist=False,
        foreign_keys="[ActividadCurricularInstancia.encuesta_instancia_id]"
    )
