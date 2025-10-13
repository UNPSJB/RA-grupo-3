export type SeriesKey = 'muyBueno' | 'bueno' | 'malo' | 'muyMalo';

export interface SeriesDescriptor {
  key: SeriesKey;
  label: string;
  color: string;
}

export interface QuestionDatum extends Record<SeriesKey, number> {
  id: string;
  question: string;
}

export interface SectionDatum {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDatum[];
}

export const responseSeries: SeriesDescriptor[] = [
  { key: 'muyBueno', label: 'Muy bueno', color: '#1A9850' },
  { key: 'bueno', label: 'Bueno', color: '#91CF60' },
  { key: 'malo', label: 'Malo', color: '#FEE08B' },
  { key: 'muyMalo', label: 'Muy malo', color: '#D73027' },
];

export const sectionsData: SectionDatum[] = [
  {
    id: 'SeccionA',
    title: 'Seccion A',
    description: 'Informacion General',
    questions: [
      {
        id: 'A1',
        question: '¿Cuántas veces te has inscripto para cursar esta asignatura?',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'A2',
        question: '¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases teóricas?',
        muyBueno: 5,
        bueno: 7,
        malo: 4,
        muyMalo: 4,
      },
      {
        id: 'A3',
        question: '¿Cuál ha sido aproximadamente tu porcentaje de asistencia a clases prácticas?',
        muyBueno: 6,
        bueno: 5,
        malo: 5,
        muyMalo: 4,
      },
      {
        id: 'A4',
        question: 'Los conocimientos previos para comprender los contenidos de la asignatura fueron: ',
        muyBueno: 8,
        bueno: 6,
        malo: 3,
        muyMalo: 3,
      },
    ],
  },
  {
    id: 'SeccionB',
    title: 'Seccion B',
    description: 'Comunicacion y desarrollo de la asignatura.',
    questions: [
      {
        id: 'B1',
        question: 'El profesor brino al inicio del curso, informacion referia al desarrollo de la asignatura.',
        muyBueno: 9,
        bueno: 5,
        malo: 3,
        muyMalo: 3,
      },
      {
        id: 'B2',
        question: 'Se respeto la planificacion de las actividades programadas al inicio del cursado y el calendario academico.',
        muyBueno: 6,
        bueno: 8,
        malo: 4,
        muyMalo: 2,
      },
      {
        id: 'B3',
        question: 'La bibliografica propuesta por la catedra estuvo disponible en la biblioteca o centros de documentacion.',
        muyBueno: 5,
        bueno: 9,
        malo: 4,
        muyMalo: 2,
      },
      {
        id: 'B4',
        question: 'El profesor ofrecio la posibilidad de establecer una buena comunicacion en diferentes aspectos de la vida universitaria.',
        muyBueno: 7,
        bueno: 6,
        malo: 5,
        muyMalo: 2,
      },
    ],
  },
  {
    id: 'SeccionC',
    title: 'Seccion C.',
    description: 'Metodologia e la cursada.',
    questions: [
      {
        id: 'C1',
        question: 'Se propusieron clases de apoyo y consulta.',
        muyBueno: 4,
        bueno: 8,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'C2',
        question: 'Existe relacion entre los contenidos desarrollados en las clases teoricas y los trabajos practicos.',
        muyBueno: 6,
        bueno: 7,
        malo: 5,
        muyMalo: 2,
      },
      {
        id: 'C3',
        question: 'Las clases practicas de laboratorio resultaron de utilidad para la comprension de los contenidos.',
        muyBueno: 5,
        bueno: 6,
        malo: 5,
        muyMalo: 4,
      },
    ],
  },
  {
    id: 'SeccionD',
    title: 'Seccion D',
    description: 'Evaluacion durante la cursaa',
    questions: [
      {
        id: 'D1',
        question: 'Las clases teoricas y las clases practicas tuvieron correlacion.',
        muyBueno: 5,
        bueno: 7,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'D2',
        question: 'La profundidad de los temas tratados en las clases teoricas y practicas es equivalente al nivel de exigencia en las evaluaciones.',
        muyBueno: 6,
        bueno: 5,
        malo: 6,
        muyMalo: 3,
      },
      {
        id: 'D3',
        question: 'La revision de evaluaciones o trabajos presentados resulta una instancia para mejorar la comprension de los contenidos.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'D$',
        question: 'Las alternativas de evaluacion propuestos por la catedra (promocion directa, informes, trabajos practicos, monografias, etc.) te resultaron convenientes para el aprendizaje.',
        muyBueno: 4,
        bueno: 8,
        malo: 5,
        muyMalo: 3,
      },
    ],
  },
  {
    id: 'SeccionE',
    title: 'Seccion E',
    description: 'Actuacion de los miembros de la catedra',
    questions: [
      {
        id: 'E1',
        question: 'Se respeto la planificacion de actividades programadas.',
        muyBueno: 6,
        bueno: 7,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E2',
        question: 'El profesor asistio a clases en el horario establecido.',
        muyBueno: 5,
        bueno: 8,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E3',
        question: 'Se presentaron aplicaciones, ejemplos, demostraciones, formas de transferencias a la vida cotidianda y profesional en el desarrollo de las clases.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'E4',
        question: 'Los recursos didacticos utilizados facilitaron el aprendizaje.',
        muyBueno: 6,
        bueno: 7,
        malo: 5,
        muyMalo: 2,
      },
      {
        id: 'E5',
        question: 'Los profesores ofrecen la posibilidad de plantear dudas y dificultades en la comprension de los temas.',
        muyBueno: 8,
        bueno: 7,
        malo: 3,
        muyMalo: 2,
      },
      {
        id: 'E6',
        question: 'Los temas desarrollados son explicados con claridad.',
        muyBueno: 9,
        bueno: 5,
        malo: 4,
        muyMalo: 2,
      },
    ],
  },
  {
    id: 'SeccionF',
    title: 'Seccion F',
    description: 'Institucional.',
    questions: [
      {
        id: 'F1',
        question: 'El personal administrativo de la facultad da respuestas a tus requerimientos.',
        muyBueno: 6,
        bueno: 6,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'F2',
        question: 'El personal administrativo respondio cordialmente a tus consultas.',
        muyBueno: 5,
        bueno: 7,
        malo: 5,
        muyMalo: 3,
      },
      {
        id: 'F3',
        question: 'El servicio de biblioteca es adecuado a tus necesidades.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F4',
        question: 'El sistema sui guarani te facilito la realizacion de tramites administrativos.',
        muyBueno: 6,
        bueno: 7,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F5',
        question: 'Las aulas y el equipamiento de los laboratorios son apropiados.',
        muyBueno: 8,
        bueno: 5,
        malo: 4,
        muyMalo: 3,
      },
      {
        id: 'F6',
        question: 'Los recursos informaticos que ofrece la institucion (pc, pc con internet, wifi, etc.) son adecuaos a tus necesidades.',
        muyBueno: 7,
        bueno: 6,
        malo: 4,
        muyMalo: 3,
      },
    ],
  },
];

export const getQuestionTotal = (question: QuestionDatum) =>
  responseSeries.reduce((sum, serie) => sum + question[serie.key], 0);

export const getTotalResponses = (data: SectionDatum[] = sectionsData) =>
  data.reduce(
    (acc, section) =>
      acc + section.questions.reduce((sectionAcc, question) => sectionAcc + getQuestionTotal(question), 0),
    0,
  );

export type ChartDatum = {
  name: string;
} & Record<SeriesKey, number>;

export const buildChartData = (data: SectionDatum[] = sectionsData): ChartDatum[] =>
  data.map((section) => {
    const totals = responseSeries.reduce(
      (acc, serie) => ({
        ...acc,
        [serie.key]: section.questions.reduce((sum, question) => sum + question[serie.key], 0),
      }),
      {} as Record<SeriesKey, number>,
    );

    return {
      name: section.title,
      ...totals,
    };
  });

export const getOptionTotals = (data: SectionDatum[] = sectionsData) => {
  const totalResponses = getTotalResponses(data);

  return responseSeries.map((serie) => {
    const total = data.reduce(
      (sum, section) =>
        sum + section.questions.reduce((questionSum, question) => questionSum + question[serie.key], 0),
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
