from __future__ import annotations
from src.materia.models import Cursada
from sqlalchemy import Integer, String,Enum, ForeignKey,Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import TipoPersona

class Persona(ModeloBase):
    __tablename__ = "persona"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[TipoPersona] = mapped_column(Enum(TipoPersona), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "persona", 
        "polymorphic_on": "tipo",
    }

class Profesor(Persona):
    __tablename__ = "profesor"
    
    id: Mapped[int] = mapped_column(ForeignKey("persona.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoPersona.DOCENTE,
    }
    cursadas_impartidas: Mapped[list["Cursada"]] = relationship(
        back_populates="profesor"
    )


class Inscripcion(ModeloBase):
    __tablename__ = "inscripcion"
    

    alumno_id: Mapped[int] = mapped_column(ForeignKey("alumno.id"), primary_key=True)
    
    cursada_id: Mapped[int] = mapped_column(ForeignKey("cursada.id"), primary_key=True)


    ha_respondido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


    alumno: Mapped["Alumno"] = relationship(back_populates="inscripciones")
    
    cursada: Mapped["Cursada"] = relationship(back_populates="inscripciones")


class Alumno(Persona):
    __tablename__ = "alumno"
    

    id: Mapped[int] = mapped_column(ForeignKey("persona.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoPersona.ALUMNO, # Valor que identifica a esta clase
    }

    inscripciones: Mapped[list["Inscripcion"]] = relationship(
        back_populates="alumno",
        cascade="all, delete-orphan",
    )
