from __future__ import annotations
from typing import List, TYPE_CHECKING, Optional
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import EstadoInstancia, TipoInstrumento
from src.instrumento.models import InstrumentoBase, InstrumentoInstancia

if TYPE_CHECKING:
    from src.instrumento.models import ActividadCurricularInstancia
    from src.materia.models import Cursada

class Encuesta(InstrumentoBase):
    __tablename__ = "encuesta" 
    id: Mapped[int] = mapped_column(ForeignKey("instrumento_base.id"), primary_key=True)
    __mapper_args__ = { "polymorphic_identity": TipoInstrumento.ENCUESTA }
    instancias: Mapped[List["EncuestaInstancia"]] = relationship(
        back_populates="plantilla", cascade="all, delete-orphan"
    )

class PeriodoEvaluacion(ModeloBase):
    __tablename__ = "periodo_evaluacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    
    fecha_inicio_encuesta: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    fecha_fin_encuesta: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    fecha_limite_informe: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_limite_sintetico: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    encuestas: Mapped[List["EncuestaInstancia"]] = relationship(
        back_populates="periodo", cascade="all, delete-orphan"
    )

class EncuestaInstancia(InstrumentoInstancia):
    __tablename__ = "encuesta_instancia"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_instancia.id"), primary_key=True)
    __mapper_args__ = { "polymorphic_identity": TipoInstrumento.ENCUESTA }
    
    estado: Mapped[EstadoInstancia] = mapped_column(
        SQLEnum(EstadoInstancia, name="estado_instancia_enum"), default=EstadoInstancia.PENDIENTE
    )

    cursada_id: Mapped[int] = mapped_column(ForeignKey("cursada.id"), unique=True, nullable=False)
    cursada: Mapped["Cursada"] = relationship(back_populates="encuesta_instancia")

    plantilla_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"), nullable=False)
    plantilla: Mapped["Encuesta"] = relationship(back_populates="instancias")

    periodo_evaluacion_id: Mapped[int] = mapped_column(ForeignKey("periodo_evaluacion.id"), nullable=False)
    periodo: Mapped["PeriodoEvaluacion"] = relationship(back_populates="encuestas")

    actividad_curricular_instancia: Mapped["ActividadCurricularInstancia"] = relationship(
        back_populates="encuesta_instancia", 
        uselist=False,
        foreign_keys="ActividadCurricularInstancia.encuesta_instancia_id"
    )