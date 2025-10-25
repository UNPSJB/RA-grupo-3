from __future__ import annotations
from datetime import datetime
from typing import List
from sqlalchemy import Integer, String, DateTime, Boolean, CheckConstraint,ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import EstadoEncuesta, EstadoInstancia
from src.respuesta.models import RespuestaSet

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.seccion.models import Seccion


#Hay que cambiar el nombre de la encuesta a: EncuestaAlumno, porque tenemos tres tipos de encuestas, para el proximo sprint
#Tambien tenemos que tener un instrumento como clase principal y esta encuesta hereda de ahi 
class Encuesta(ModeloBase):
    __tablename__ = "encuesta" #cambio de nombre a encuesta singular por un tema de buenas practicas

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)

    # estados de la encuesta
    estado: Mapped[EstadoEncuesta] = mapped_column(
          SQLEnum(EstadoEncuesta, name = "estado_encuesta_enum"), default=EstadoEncuesta.BORRADOR
    )

    secciones: Mapped[List["Seccion"]] = relationship(
        back_populates="encuesta", cascade="all, delete-orphan")

    instancias: Mapped[List["EncuestaInstancia"]] = relationship(
        back_populates="plantilla"
    )


class EncuestaInstancia(ModeloBase):
    __tablename__ = "encuesta_instancia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # fecha de inicio y de fin para cuando se pone activa la encuesta o se cierra
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()) # esto deja la fecha de creacion automaticamente.
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True) # es nulleable ya que no conocemos cuando va a cerrar la encuesta

    estado: Mapped[EstadoInstancia] = mapped_column(
        SQLEnum(EstadoInstancia, name="estado_instancia_enum"), default=EstadoInstancia.PENDIENTE
    )

    cursada_id: Mapped[int] = mapped_column(ForeignKey("cursada.id"), unique=True, nullable=False)
    cursada: Mapped["Cursada"] = relationship(back_populates="encuesta_instancia")

    plantilla_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"), nullable=False)
    plantilla: Mapped["Encuesta"] = relationship(back_populates="instancias")

    respuesta_sets: Mapped[List["RespuestaSet"]] = relationship(
        "RespuestaSet", back_populates="encuesta_instancia", cascade="all, delete-orphan"
    )