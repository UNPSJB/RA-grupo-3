from __future__ import annotations
from typing import List
from datetime import datetime
from src.respuesta.models import RespuestaSet
from src.models import ModeloBase
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.enumerados import EstadoInstrumento,TipoInstrumento,EstadoInforme
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.seccion.models import Seccion
    from src.materia.models import Cursada
    from src.encuestas.models import EncuestaInstancia
    from src.persona.models import Profesor
    from src.materia.models import Departamento

class InstrumentoBase(ModeloBase): 
    __tablename__ = "instrumento_base"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String, index=True)
    descripcion: Mapped[str] = mapped_column(String, index=True)
    anexo: Mapped[str] = mapped_column(String, nullable=True)
    #estados en los que puede estar el instrumento
    estado: Mapped[EstadoInstrumento] = mapped_column(
          SQLEnum(EstadoInstrumento, name = "estado_instrumento_enum"), default=EstadoInstrumento.BORRADOR
    )
    tipo: Mapped[TipoInstrumento] = mapped_column(SQLEnum(TipoInstrumento), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "instrumento_base",
        "polymorphic_on": "tipo",
    }
    secciones: Mapped[List["Seccion"]] = relationship(
        back_populates="instrumento", cascade="all, delete-orphan")
    
#clases hijas
class ActividadCurricular(InstrumentoBase):
    __tablename__ = "actividad_curricular"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_base.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.ACTIVIDAD_CURRICULAR,
    }
    instancias_curriculares: Mapped[List["ActividadCurricularInstancia"]] = relationship(
        back_populates="actividad_curricular", cascade="all, delete-orphan"
    )



class InformeSintetico(InstrumentoBase):
    __tablename__ = "informe_sintetico"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_base.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.INFORME_SINTETICO,
    }
    instancias_sinteticas: Mapped[List["InformeSinteticoInstancia"]] = relationship(
        back_populates="informe_sintetico", cascade="all, delete-orphan"
    )



class InstrumentoInstancia(ModeloBase):
    __tablename__ = "instrumento_instancia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # fecha de inicio y de fin para cuando se pone activa la encuesta o se cierra
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()) # esto deja la fecha de creacion automaticamente.
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True) # es nulleable ya que no conocemos cuando va a cerrar la encuesta

    tipo: Mapped[TipoInstrumento] = mapped_column(SQLEnum(TipoInstrumento), nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "instrumento_instancia",
        "polymorphic_on": "tipo",
    }

    respuesta_sets: Mapped[List["RespuestaSet"]] = relationship(
            "RespuestaSet", 
            back_populates="instrumento_instancia", 
            cascade="all, delete-orphan"
    )

class ActividadCurricularInstancia(InstrumentoInstancia):
    __tablename__ = "actividad_curricular_instancia"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_instancia.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.ACTIVIDAD_CURRICULAR,
    }

    actividad_curricular_id: Mapped[int] = mapped_column(ForeignKey("actividad_curricular.id"), nullable=False)

    actividad_curricular: Mapped["ActividadCurricular"] = relationship(back_populates="instancias_curriculares")

    estado: Mapped[EstadoInforme] = mapped_column(
        SQLEnum(EstadoInforme, name="estado_informe_enum"), default=EstadoInforme.PENDIENTE
    )

    #De que cursada es:
    cursada_id: Mapped[int] = mapped_column(ForeignKey("cursada.id"), unique=True, nullable=False)

    cursada: Mapped["Cursada"] = relationship(back_populates="actividad_curricular_instancia")

    #En base a que encuesta es:
    encuesta_instancia_id: Mapped[int] = mapped_column(ForeignKey("encuesta_instancia.id"), nullable=False)
    encuesta_instancia: Mapped["EncuestaInstancia"] = relationship(
        back_populates="actividad_curricular_instancia",
        foreign_keys=[encuesta_instancia_id] 
    )

    #Es llenada por el profesor:
    profesor_id: Mapped[int] =  mapped_column(ForeignKey("profesor.id"), nullable=False)
    profesor: Mapped["Profesor"]= relationship(back_populates="actividades_curriculares")
    
    #Resumida por:
    informe_sintetico_instancia_id: Mapped[int | None] = mapped_column(ForeignKey("informe_sintetico_instancia.id"), nullable=True)
    
    informe_sintetico_instancia: Mapped["InformeSinteticoInstancia"] = relationship(
        back_populates="actividades_curriculares_instancia",
        foreign_keys=[informe_sintetico_instancia_id] 
    )

    
class InformeSinteticoInstancia(InstrumentoInstancia):
    __tablename__ = "informe_sintetico_instancia"

    id: Mapped[int] = mapped_column(ForeignKey("instrumento_instancia.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoInstrumento.INFORME_SINTETICO,
    }   
    informe_sintetico_id: Mapped[int] = mapped_column(ForeignKey("informe_sintetico.id"), nullable=False)
    informe_sintetico: Mapped["InformeSintetico"] = relationship(back_populates="instancias_sinteticas")
    integrantes_comision: Mapped[str | None] = mapped_column(String, nullable=True)
    estado: Mapped[EstadoInforme] = mapped_column(
        SQLEnum(EstadoInforme, name="estado_informe_enum"), 
        default=EstadoInforme.PENDIENTE
    )

    actividades_curriculares_instancia: Mapped[List["ActividadCurricularInstancia"]] = relationship(
        back_populates="informe_sintetico_instancia",       
        foreign_keys="ActividadCurricularInstancia.informe_sintetico_instancia_id"
    )
    departamento_id: Mapped[int | None] = mapped_column(ForeignKey("departamentos.id"), nullable=True)
    departamento: Mapped["Departamento"] = relationship(
        back_populates="informes_sinteticos"
    )