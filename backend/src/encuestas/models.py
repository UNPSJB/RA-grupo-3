from datetime import datetime

from sqlalchemy import Integer, String, DateTime #agregado datetime

from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase

class Encuesta(ModeloBase):
    __tablename__ = "encuesta" #cambio de nombre a encuesta singular por un tema de buenas practicas

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)

# fecha de inicio y de fin para cuando se pone activa la encuesta o se cierra
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now())
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    
     
    # Faltaria la relación con las preguntas