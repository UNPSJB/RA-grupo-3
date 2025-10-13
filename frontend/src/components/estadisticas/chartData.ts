export type SeriesKey = 'muyBueno' | 'bueno' | 'malo' | 'muyMalo';

export interface SeriesDescriptor {
  key: SeriesKey;
  label: string;
  color: string;
}

export interface preguntaDato extends Record<SeriesKey, number> {
  id: string;
  pregunta: string;
}

export interface SeccionDato {
  id: string;
  titulo: string;
  descripcion?: string;
  preguntas: preguntaDato[];
}

export const responseSeries: SeriesDescriptor[] = [
  { key: 'muyBueno', label: 'Muy bueno', color: '#1A9850' },
  { key: 'bueno', label: 'Bueno', color: '#91CF60' },
  { key: 'malo', label: 'Malo', color: '#FEE08B' },
  { key: 'muyMalo', label: 'Muy malo', color: '#D73027' },
];

export const seccionsData: SeccionDato[] = [
  {
    id: 'SeccionA',
    titulo: 'Seccion A',
    descripcion: 'Informacion General',
    preguntas: [
      {
        id: 'A1',
        pregunta: '¿Cuántas veces te has inscripto para cursar esta asignatura?',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'A2',
        pregunta: '¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases teóricas?',
        muyBueno: 5,
        bueno: 7,
        malo: 4,
        muyMalo: 4,
      },
      {
        id: 'A3',
        pregunta: '¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases prácticas?',
        muyBueno: 6,
        bueno: 5,
        malo: 5,
        muyMalo: 4,
      },
      {
        id: 'A4',
        pregunta: 'Los conocimientos previos para comprender los contenidos de la asignatura fueron: ',
        muyBueno: 8,
        bueno: 6,
        malo: 3,
        muyMalo: 3,
      },
    ],
  },
  {
    id: 'SeccionB',
    titulo: 'Seccion B',
    descripcion: 'Comunicacion y desarrollo de la asignatura.',
    preguntas: [
      {
        id: 'B1',
        pregunta: 'El profesor brino al inicio del curso, informacion referia al desarrollo de la asignatura.',
        muyBueno: 9,
        bueno: 5,
        malo: 3,
        muyMalo: 3,
      },
      {
        id: 'B2',
        pregunta: 'Se respeto la planificacion de las actividades programadas al inicio del cursado y el calendario academico.',
        muyBueno: 6,
        bueno: 8,
        malo: 4,
        muyMalo: 2,
      },
      {
        id: 'B3',
        pregunta: 'La bibliografica propuesta por la catedra estuvo disponible en la biblioteca o centros de documentacion.',
        muyBueno: 5,
        bueno: 9,
        malo: 4,
        muyMalo: 2,
      },
      {
        id: 'B4',
        pregunta: 'El profesor ofrecio la posibilidad de establecer una buena comunicacion en diferentes aspectos de la vida universitaria.',
        muyBueno: 7,
        bueno: 6,
        malo: 5,
        muyMalo: 2,
      },
    ],
  },
  {
    id: 'SeccionC',
    titulo: 'Seccion C.',
    descripcion: 'Metodologia e la cursada.',
    preguntas: [
      {
        id: 'C1',
        pregunta: 'Se propusieron clases de apoyo y consulta.',
        muyBueno: 4,
        bueno: 8,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'C2',
        pregunta: 'Existe relacion entre los contenidos desarrollados en las clases teoricas y los trabajos practicos.',
        muyBueno: 6,
        bueno: 7,
        malo: 5,
        muyMalo: 2,
      },
      {
        id: 'C3',
        pregunta: 'Las clases practicas de laboratorio resultaron de utilidad para la comprension de los contenidos.',
        muyBueno: 5,
        bueno: 6,
        malo: 5,
        muyMalo: 4,
      },
    ],
  },
  {
    id: 'SeccionD',
    titulo: 'Seccion D',
    descripcion: 'Evaluacion durante la cursaa',
    preguntas: [
      {
        id: 'D1',
        pregunta: 'Las clases teoricas y las clases practicas tuvieron correlacion.',
        muyBueno: 5,
        bueno: 7,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'D2',
        pregunta: 'La profundidad de los temas tratados en las clases teoricas y practicas es equivalente al nivel de exigencia en las evaluaciones.',
        muyBueno: 6,
        bueno: 5,
        malo: 6,
        muyMalo: 3,
      },
      {
        id: 'D3',
        pregunta: 'La revision de evaluaciones o trabajos presentados resulta una instancia para mejorar la comprension de los contenidos.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'D$',
        pregunta: 'Las alternativas de evaluacion propuestos por la catedra (promocion directa, informes, trabajos practicos, monografias, etc.) te resultaron convenientes para el aprendizaje.',
        muyBueno: 4,
        bueno: 8,
        malo: 5,
        muyMalo: 3,
      },
    ],
  },
  {
    id: 'SeccionE',
    titulo: 'Seccion E',
    descripcion: 'Actuacion de los miembros de la catedra',
    preguntas: [
      {
        id: 'E1',
        pregunta: 'Se respeto la planificacion de actividades programadas.',
        muyBueno: 6,
        bueno: 7,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E2',
        pregunta: 'El profesor asistio a clases en el horario establecido.',
        muyBueno: 5,
        bueno: 8,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E3',
        pregunta: 'Se presentaron aplicaciones, ejemplos, demostraciones, formas de transferencias a la vida cotidianda y profesional en el desarrollo de las clases.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E4',
        pregunta: 'Los recursos didacticos utilizados facilitaron el aprendizaje.',
        muyBueno: 6,
        bueno: 7,
        malo: 5,
        muyMalo: 2,
      },
      {
        id: 'E5',
        pregunta: 'Los profesores ofrecen la posibilidad de plantear dudas y dificultades en la comprension de los temas.',
        muyBueno: 8,
        bueno: 7,
        malo: 3,
        muyMalo: 2,
      },
      {
        id: 'E6',
        pregunta: 'Los temas desarrollados son explicados con claridad.',
        muyBueno: 9,
        bueno: 5,
        malo: 4,
        muyMalo: 2,
      },
    ],
  },
  {
    id: 'SeccionF',
    titulo: 'Seccion F',
    descripcion: 'Institucional.',
    preguntas: [
      {
        id: 'F1',
        pregunta: 'El personal administrativo de la facultad da respuestas a tus requerimientos.',
        muyBueno: 6,
        bueno: 6,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'F2',
        pregunta: 'El personal administrativo respondio cordialmente a tus consultas.',
        muyBueno: 5,
        bueno: 7,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'F3',
        pregunta: 'El servicio de biblioteca es adecuado a tus necesidades.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F4',
        pregunta: 'El sistema sui guarani te facilito la realizacion de tramites administrativos.',
        muyBueno: 6,
        bueno: 7,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F5',
        pregunta: 'Las aulas y el equipamiento de los laboratorios son apropiados.',
        muyBueno: 8,
        bueno: 5,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F6',
        pregunta: 'Los recursos informaticos que ofrece la institucion (pc, pc con internet, wifi, etc.) son adecuaos a tus necesidades.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
    ],
  },
];

export const getpreguntaTotal = (pregunta: preguntaDato) =>
  responseSeries.reduce((sum, serie) => sum + pregunta[serie.key], 0);

export const getTotalResponses = (data: SeccionDato[] = seccionsData) =>
  data.reduce(
    (acc, seccion) =>
      acc + seccion.preguntas.reduce((seccionAcc, pregunta) => seccionAcc + getpreguntaTotal(pregunta), 0),
    0,
  );

export type ChartDato = {
  nombre: string;
} & Record<SeriesKey, number>;

export const buildChartData = (data: SeccionDato[] = seccionsData): ChartDato[] =>
  data.map((seccion) => {
    const totals = responseSeries.reduce(
      (acc, serie) => ({
        ...acc,
        [serie.key]: seccion.preguntas.reduce((sum, pregunta) => sum + pregunta[serie.key], 0),
      }),
      {} as Record<SeriesKey, number>,
    );

    return {
      nombre: seccion.titulo,
      ...totals,
    };
  });

export const getOptionTotals = (data: SeccionDato[] = seccionsData) => {
  const totalResponses = getTotalResponses(data);

  return responseSeries.map((serie) => {
    const total = data.reduce(
      (sum, seccion) =>
        sum + seccion.preguntas.reduce((preguntaSum, pregunta) => preguntaSum + pregunta[serie.key], 0),
      0,
    );
    const percent = totalResponses === 0 ? 0 : (total / totalResponses) * 100;

    return {
      ...serie,
      total,
      percent,
    };
  });
};

export const chartData = buildChartData();
