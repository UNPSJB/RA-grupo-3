from typing import List, Optional
from sqlalchemy import Integer, String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase  
import enum

from tablas.seccion.models import Seccion


class TipoPregunta(enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE"
    REDACCION = "TEXTO"


class TipoOpciones(enum.Enum):
    BUENO = "Bueno"
    MALO = "Malo"
    MUY_BUENO = "Muy bueno"
    MUY_MALO = "Muy malo"

class Pregunta(ModeloBase):
    __tablename__ = "pregunta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=True)
    tipo: Mapped[TipoPregunta] = mapped_column(Enum(TipoPregunta), nullable=False)
    seccion_id: Mapped[int] = mapped_column(ForeignKey("seccion.id"), nullable=False)
    respuesta: Mapped[TipoOpciones] = mapped_column(Enum(TipoOpciones), nullable=True)

    seccion: Mapped["Seccion"] = relationship(back_populates="preguntas")
    opciones: Mapped[List["Opcion"]] = relationship(back_populates="pregunta", cascade="all, delete-orphan")


class Opcion(ModeloBase):
    __tablename__ = "opcion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    texto: Mapped[str] = mapped_column(String(255), nullable=False)
    pregunta_id: Mapped[int] = mapped_column(ForeignKey("pregunta.id"), nullable=False)
    pregunta: Mapped["Pregunta"] = relationship(back_populates="opciones")
