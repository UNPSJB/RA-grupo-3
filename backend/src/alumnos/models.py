from typing import Optional, List
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase


class Alumno(ModeloBase):
    __tablename__ = "alumnos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    encuestas: Mapped[Optional[List["src.mascotas.models.Mascota"]]] = relationship(
        "src.mascotas.models.Mascota", back_populates="tutor"
    )
