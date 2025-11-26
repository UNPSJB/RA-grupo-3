from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING, List


from sqlalchemy import Integer, String, DateTime, ForeignKey, Table, Column
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models import ModeloBase
from src.enumerados import TipoCuatrimestre, CicloMateria

# Mover imports conflictivos aquí dentro
if TYPE_CHECKING:
    from src.encuestas.models import EncuestaInstancia
    from src.instrumento.models import ActividadCurricularInstancia, InformeSinteticoInstancia
    from src.persona.models import Profesor, Inscripcion

# Tabla de asociación Many-to-Many entre Carrera y Materia
carrera_materia_association = Table(
    "carrera_materia_association",
    ModeloBase.metadata,
    Column("carrera_id", Integer, ForeignKey("carreras.id"), primary_key=True),
    Column("materia_id", Integer, ForeignKey("materia.id"), primary_key=True),
)
# --- FIN DEL CAMBIO ---


class Materia(ModeloBase):
    __tablename__ = "materia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    nombre: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)
    
    ciclo: Mapped[CicloMateria] = mapped_column(
        SQLEnum(CicloMateria, name="ciclo_materia_enum"),
        default=CicloMateria.BASICO,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
 
       DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    cursadas: Mapped[list["Cursada"]] = relationship(
        back_populates="materia", cascade="all, delete-orphan"
    )

    # --- CAMBIO: Esta relación ahora encuentra la tabla de asociación ---
    carreras: Mapped[List["Carrera"]] = relationship(
        secondary=carrera_materia_association,
        back_populates="materias"
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


# --- NUEVAS ENTIDADES ---

class Sede(ModeloBase):
    __tablename__ = "sedes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    localidad: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    
    # Relación inversa: Una Sede tiene muchos Departamentos
    departamentos: Mapped[List["Departamento"]] = relationship(back_populates="sede")


class Departamento(ModeloBase):
    __tablename__ = "departamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    # Relación: Un Departamento pertenece a una Sede (Muchos a Uno)
    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id"), nullable=False)
    sede: Mapped["Sede"] = relationship(back_populates="departamentos")

    # Relación inversa: Un Departamento tiene muchas Carreras (Uno a Muchos)
    carreras: Mapped[List["Carrera"]] = relationship(back_populates="departamento")
    
    # Relación inversa: Un Departamento genera muchos Informes Sintéticos (Uno a Muchos)
    informes_sinteticos: Mapped[List["InformeSinteticoInstancia"]] = relationship(
        back_populates="departamento"
    )


class Carrera(ModeloBase):
    __tablename__ = "carreras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    
    # Relación: Una Carrera pertenece a un Departamento (Muchos a Uno)
    departamento_id: Mapped[int] = mapped_column(ForeignKey("departamentos.id"), nullable=False)
    departamento: Mapped["Departamento"] = relationship(back_populates="carreras")

    # Relación: Una Carrera tiene muchas Materias (Muchos a Muchos)
    materias: Mapped[List["Materia"]] = relationship(
        secondary=carrera_materia_association,
        back_populates="carreras"
    )                               