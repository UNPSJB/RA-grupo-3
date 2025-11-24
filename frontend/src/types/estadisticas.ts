// Corresponde a schemas.ResultadoOpcion
export interface ResultadoOpcion {
  opcion_id: number;
  opcion_texto: string;
  cantidad: number;
}

// Corresponde a schemas.RespuestaTextoItem
export interface RespuestaTextoItem {
  texto: string;
}

// Corresponde a schemas.ResultadoPregunta
export interface ResultadoPregunta {
  pregunta_id: number;
  pregunta_texto: string;
  pregunta_tipo: "REDACCION" | "MULTIPLE_CHOICE";
  resultados_opciones: ResultadoOpcion[] | null;
  respuestas_texto: RespuestaTextoItem[] | null;
}

export interface ResultadoSeccion {
  seccion_nombre: string;
  resultados_por_pregunta: ResultadoPregunta[];
}

export interface ResultadoCursada {
  cursada_id: number;
  materia_nombre: string;
  cuatrimestre_info: string;
  cantidad_respuestas: number;

  resultados_por_seccion: ResultadoSeccion[];
  informe_curricular_instancia_id?: number | null;
  fecha_cierre?: string | null;
}

export interface PlantillaBase {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  anexo?: string | null;
}

export interface InformeSinteticoList {
  id: number;
  fecha_inicio: string; // Las fechas llegan como strings ISO
  fecha_fin?: string | null;
  tipo: string;
  plantilla: PlantillaBase;
  departamento_id: number;
  cantidad_reportes: number;
}

export interface InformeSinteticoResultado {
  informe_id: number;
  departamento_nombre: string;
  fecha_generacion: string; // Las fechas llegan como strings ISO
  cantidad_total_reportes: number;
  resultados_por_seccion: ResultadoSeccion[];
}

//para el dpto
export interface StatDato {
  label: string;
  value: number;
}

export interface DashboardDepartamentoStats {
  informes_total: number;
  informes_pendientes: number;
  informes_completados: number;
  cobertura_contenidos: StatDato[];
  necesidades_recientes: string[];
}
