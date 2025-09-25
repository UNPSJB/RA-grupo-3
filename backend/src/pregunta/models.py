#Define la estructura de los datos de nuestra aplicacion al momento de ser guardados en una BD
from typing import List, Optional
from sqlalchemy import Integer, String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase  # tu base declarativa
import enum

class TipoPregunta(enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    REDACCION = "REDACCION"


class Pregunta(ModeloBase):
    __tablename__ = "preguntas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)
    tipo: Mapped[TipoPregunta] = mapped_column(Enum(TipoPregunta), nullable=False)
    encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"))
    # Relaciones
    opciones: Mapped[Optional[List["Opcion"]]] = relationship(
        "Opcion", back_populates="pregunta", cascade="all, delete-orphan"
    )

    encuesta: Mapped["Encuesta"] = relationship(
        "Encuesta",back_populates="preguntas")

class Opcion(ModeloBase):
    __tablename__ = "opciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(255), nullable=False)

    pregunta_id: Mapped[int] = mapped_column(ForeignKey("preguntas.id"), nullable=False)
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="opciones")