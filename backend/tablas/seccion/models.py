from typing import List
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from tablas.pregunta.models import Pregunta
    from tablas.encuesta.models import Encuesta

class Seccion(ModeloBase):
    __tablename__ = "seccion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(500))
    encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"), nullable=False)

    encuesta: Mapped["Encuesta"] = relationship("Encuesta", back_populates="secciones")
    preguntas: Mapped[List["Pregunta"]] = relationship("Pregunta", back_populates="seccion", cascade="all, delete-orphan")