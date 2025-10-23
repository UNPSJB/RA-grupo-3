export interface EstadisticasOpcion {
  texto: string;
  total: number;
  porcentaje: number;
}

export interface EstadisticasPreguntaAbierta {
  pregunta_id: number;
  texto: string;
  total_respuestas: number;
  ejemplos: string[];
}

export interface EstadisticasSeccion {
  id: number;
  nombre: string;
  total_respuestas: number;
  total_respuestas_opciones: number;
  total_respuestas_abiertas: number;
  opciones: EstadisticasOpcion[];
  preguntas_abiertas: EstadisticasPreguntaAbierta[];
}

export interface EstadisticasResumen {
  total_respuestas: number;
  total_respuestas_opciones: number;
  opciones_totales: EstadisticasOpcion[];
  secciones: EstadisticasSeccion[];
}
