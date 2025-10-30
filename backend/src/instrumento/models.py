from __future__ import annotations
from enum import Enum, StrEnum
from typing import List
from datetime import datetime
from src.respuesta.models import RespuestaSet
from src.models import ModeloBase
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.enumerados import EstadoInstrumento,TipoInstrumento
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.seccion.models import Seccion


class InstrumentoBase(ModeloBase): 
    __tablename__ = "instrumento_base"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)
    #estados en los que puede estar el instrumento
    estado: Mapped[EstadoInstrumento] = mapped_column(
          SQLEnum(EstadoInstrumento, name = "estado_instrumento_enum"), default=EstadoInstrumento.BORRADOR
    )
    tipo: Mapped[TipoInstrumento] = mapped_column(SQLEnum(TipoInstrumento), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "instrumento_base",
        "polymorphic_on": "tipo",
    }
    secciones: Mapped[List["Seccion"]] = relationship(
        back_populates="instrumento", cascade="all, delete-orphan")

class InstrumentoInstancia(ModeloBase):
    __tablename__ = "instrumento_instancia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # fecha de inicio y de fin para cuando se pone activa la encuesta o se cierra
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()) # esto deja la fecha de creacion automaticamente.
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True) # es nulleable ya que no conocemos cuando va a cerrar la encuesta

    tipo: Mapped[TipoInstrumento] = mapped_column(SQLEnum(TipoInstrumento), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "instrumento_instancia",
        "polymorphic_on": "tipo",
    }

    respuesta_sets: Mapped[List["RespuestaSet"]] = relationship(
            "RespuestaSet", 
            back_populates="instrumento_instancia", 
            cascade="all, delete-orphan"
    )