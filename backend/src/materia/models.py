from __future__ import annotations
from datetime import datetime
from src.encuestas.models import EncuestaInstancia
from sqlalchemy import Integer, String, DateTime,ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import TipoCuatrimestre
from src.instrumento.models import ActividadCurricularInstancia

class Materia(ModeloBase):
    __tablename__ = "materia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    nombre: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(
 
       DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    cursadas: Mapped[list["Cursada"]] = relationship(
        back_populates="materia", cascade="all, delete-orphan"
    )


class Cuatrimestre(ModeloBase):
    __tablename__ = "cuatrimestre"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    anio: Mapped[int] = mapped_column(Integer, nullable=False)

    periodo: Mapped[TipoCuatrimestre] = mapped_column(
        SQLEnum(TipoCuatrimestre, name="cuatrimestre_enum"), nullable=True)
    
    cursadas: Mapped[list["Cursada"]] = relationship(
        back_populates="cuatrimestre", cascade="all, delete-orphan"
    )
    

class Cursada(ModeloBase):
    __tablename__  = "cursada"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    materia_id: Mapped[int] = mapped_column(ForeignKey("materia.id"), nullable=False)
    materia: Mapped[Materia]= relationship(back_populates="cursadas")
    
    cuatrimestre_id: Mapped[int] =  mapped_column(ForeignKey("cuatrimestre.id"), nullable=False)    
    cuatrimestre: Mapped[Cuatrimestre]= relationship(back_populates="cursadas")
    

    profesor_id: Mapped[int] =  mapped_column(ForeignKey("profesor.id"), nullable=False)
    profesor: Mapped["Profesor"]= relationship(back_populates="cursadas_impartidas")

    inscripciones: Mapped[list["Inscripcion"]] = relationship(
        back_populates="cursada", cascade="all, delete-orphan"
    )

    encuesta_instancia: Mapped["EncuestaInstancia"] = relationship(
        back_populates="cursada"
    )
    
    actividad_curricular_instancia: Mapped["ActividadCurricularInstancia"] = relationship(
        back_populates="cursada"
    )

