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
}
