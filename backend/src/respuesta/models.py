# src/Respuesta/models.py
from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from src.models import ModeloBase
from sqlalchemy import Column, DateTime, func

class Respuesta(ModeloBase):
    __tablename__ = "respuestas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Para respuestas de redacción
    texto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Para respuestas de opción múltiple
    opcion_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("opciones.id"), nullable=True
    )
    
    # Pregunta a la que corresponde esta respuesta
    pregunta_id: Mapped[int] = mapped_column(
        ForeignKey("preguntas.id"), nullable=False
    )
    
    # Relaciones
    pregunta: Mapped["Pregunta"] = relationship(
        "Pregunta", back_populates="respuestas"
    )
    opcion: Mapped[Optional["Opcion"]] = relationship(
        "Opcion", back_populates="respuestas"
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


    