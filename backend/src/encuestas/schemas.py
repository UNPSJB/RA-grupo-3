from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from src.seccion.schemas import Seccion

from src.enumerados import EstadoInstancia,TipoPregunta,TipoInstrumento



class DashboardProfesorItem(BaseModel):
    materia_id: int
    materia_nombre: str
    cantidad_inscriptos: int
    cantidad_respuestas: int
    fecha_fin: Optional[datetime] = None
    estado: str # "activa", "cerrada", etc.
#instrumento
class InstrumentoBaseCreate(BaseModel):
    titulo: str
    descripcion: str

class InstrumentoBase(InstrumentoBaseCreate):
    id: int
    tipo: TipoInstrumento 

    class Config:
        from_attributes = True 

#plantilla
    
class EncuestaAlumnoPlantillaCreate(InstrumentoBaseCreate):
    pass

class EncuestaAlumnoPlantilla(InstrumentoBase):
    secciones: Optional[List[Seccion]] = None   
    pass

class EncuestaAlumnoPlantillaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None

class PlantillaInfo(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str] = None

    model_config = {"from_attributes": True}

#instancia

class EncuestaInstanciaBase(BaseModel):
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    estado: EstadoInstancia = Field(default = EstadoInstancia.PENDIENTE)

class EncuestaInstanciaCreate(EncuestaInstanciaBase):
    cursada_id: int
    plantilla_id: int

class EncuestaInstancia(EncuestaInstanciaBase):
    id: int
    cursada_id: int
    plantilla_id: int
    plantilla: EncuestaAlumnoPlantilla
    model_config = {"from_attributes": True}

class EncuestaActivaAlumnoResponse(BaseModel):
    instancia_id: int
    plantilla: PlantillaInfo 
    materia_nombre: Optional[str] = None 
    profesor_nombre: Optional[str] = None
    fecha_fin: Optional[datetime] = None 
    ha_respondido: bool

    model_config = {"from_attributes": True}

class InstanciaConPlantillaResponse(BaseModel):
     instancia_id: int
     plantilla: EncuestaAlumnoPlantilla


class ResultadoOpcion(BaseModel):
    opcion_id: int
    opcion_texto: str
    cantidad: int 

class RespuestaTextoItem(BaseModel):
    texto: str

class ResultadoPregunta(BaseModel):
    pregunta_id: int
    pregunta_texto: str
    pregunta_tipo: TipoPregunta 
    resultados_opciones: Optional[List[ResultadoOpcion]] = None
    respuestas_texto: Optional[List[RespuestaTextoItem]] = None

    model_config = {"from_attributes": True} 


class ResultadoSeccion(BaseModel):
    seccion_nombre: str
    resultados_por_pregunta: List[ResultadoPregunta]
    model_config = {"from_attributes": True}

class ResultadoCursada(BaseModel):
    cursada_id: int
    materia_nombre: str
    cuatrimestre_info: str 
    cantidad_respuestas: int 
    resultados_por_seccion: List[ResultadoSeccion]  
    
    informe_curricular_instancia_id: Optional[int] = None 
    fecha_cierre: Optional[datetime] = None
    model_config = {"from_attributes": True}

class InformeSinteticoResultado(BaseModel):
    """Schema para los resultados agregados de un Informe Sintético."""
    informe_id: int
    departamento_nombre: str
    fecha_generacion: datetime
    cantidad_total_reportes: int
    # Reutilizamos los schemas de resultados de encuestas
    resultados_por_seccion: List[ResultadoSeccion]  
    model_config = {"from_attributes": True}

#Para el informe sintetico
class GenerarSinteticoRequest(BaseModel):
    departamento_id: int
class GenerarSinteticoResponse(BaseModel):
    instancia_id: int
    departamento_id: int
    cantidad_informes: int
    
    model_config = {"from_attributes": True}

#Para la funcionalidad de activar encuestas
class CursadaAdminList(BaseModel):
    id: int
    materia_nombre: str
    profesor_nombre: str
    anio: int
    periodo: str
    
    model_config = {"from_attributes": True}

class EncuestaActivaAdminList(BaseModel):
    id: int
    materia_nombre: str
    fecha_inicio: datetime
    estado: EstadoInstancia

    model_config = {"from_attributes": True}

class DepartamentoSimple(BaseModel):
    id: int
    nombre: str
    
    model_config = {"from_attributes": True}

class CerrarEncuestaBody(BaseModel):
    fecha_fin_informe: Optional[datetime] = None

class GenerarSinteticoRequest(BaseModel):
    departamento_id: int
    fecha_fin_informe: Optional[datetime] = None 

#estadisticas del informe
class StatDato(BaseModel):
    label: str
    value: int

class DashboardDepartamentoStats(BaseModel):
    # Gráfico 1: Semáforo de cumplimiento (Donut Chart)
    informes_total: int
    informes_pendientes: int
    informes_completados: int
    
    # Gráfico 2: Cobertura de Contenidos (Bar Chart - Sección 2.A)
    cobertura_contenidos: List[StatDato]
    
    # Listado: Últimas necesidades detectadas (Sección 1)
    necesidades_recientes: List[str]

class InformeHistoricoResponse(BaseModel):
    instancia_id: int
    materia_nombre: str
    cuatrimestre_info: str
    profesor_nombre: Optional[str] = None
    fecha_envio: Optional[datetime] = None
    estado: str

    model_config = {"from_attributes": True}