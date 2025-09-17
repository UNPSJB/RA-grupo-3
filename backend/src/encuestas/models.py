from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Boolean, Enum, CheckConstraint #agregado datetime, Enum, checkconstraint y boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase

from enum import Enum


class TipoCuatrimestre(str, Enum):
    PRIMERO = "primero"
    SEGUNDO = "segundo"
    ANUAL = "anual"

class Encuesta(ModeloBase):
    __tablename__ = "encuesta" #cambio de nombre a encuesta singular por un tema de buenas practicas


    # filtro para saber en que año de la carrera pertenece la encuesta
    # restringido a poner entre 1 y 6 años (osea primero a sexto por las dudas)
    __table_args__ = (
        CheckConstraint("anio_carrera BETWEEN 1 AND 6", name="ck_encuesta_anio_carrera"),
        )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)

# año para filtrar por que año de la carrera corresponde la encuesta
    anio_carrera: Mapped[int] = mapped_column(Integer, nullable=False)

# para filtrar por cuatrimestre
    cursada: Mapped[TipoCuatrimestre] = mapped_column(
        Enum(TipoCuatrimestre, name="cuatrimestre_enum"), nullable=False
    )

# fecha de inicio y de fin para cuando se pone activa la encuesta o se cierra
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()) # esto deja la fecha de creacion automaticamente.
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True) # es nulleable ya que no conocemos cuando va a cerrar la encuesta
    
# para saber si esta completa la encuesta
    esta_completa: Mapped[bool] = mapped_column(Boolean, default=False)
 
    # Faltaria la relación con las preguntas