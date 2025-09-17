from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase

class Encuesta(ModeloBase):
    __tablename__ = "encuestas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)
    # Faltaria la relación con las preguntas