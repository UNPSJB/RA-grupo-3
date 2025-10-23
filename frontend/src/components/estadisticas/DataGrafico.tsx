import React from 'react';

import type {
  EstadisticasOpcion,
  EstadisticasPreguntaAbierta,
  EstadisticasSeccion,
} from '../../types/estadisticas';
import type { SeriesDescriptor } from './chartData';

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface SectionBreakdownProps {
  sections: EstadisticasSeccion[];
  series: SeriesDescriptor[];
  normalizer: (value: string) => string;
}

export const SectionBreakdown: React.FC<SectionBreakdownProps> = ({
  sections,
  series,
  normalizer,
}) => {
  if (sections.length === 0 || series.length === 0) {
    return (
      <section className="bg-white p-5 rounded-xl shadow-sm text-sm text-gray-500">
        No hay resultados de preguntas de opción múltiple para mostrar.
      </section>
    );
  }

  return (
    <section className="bg-white p-5 rounded-xl shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Porcentaje por sección
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Sección</th>
              {series.map((serie) => (
                <th key={serie.key} className="px-4 py-2 text-left font-medium">
                  {serie.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {sections.map((section) => (
              <tr key={section.id}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {section.nombre}
                </td>
                {series.map((serie) => {
                  const match = section.opciones.find(
                    (option) => normalizer(option.texto) === serie.key,
                  );
                  const percent = match?.porcentaje ?? 0;
                  const value = match?.total ?? 0;
                  return (
                    <td key={serie.key} className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {formatPercent(percent)}
                      </p>
                      <p className="text-[11px] text-gray-500">{value} resp.</p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

interface OptionTotalsProps {
  totals: EstadisticasOpcion[];
  totalResponses: number;
}

export const OptionTotals: React.FC<OptionTotalsProps> = ({
  totals,
  totalResponses,
}) => {
  if (totals.length === 0) {
    return null;
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Porcentaje total por opción
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {totals.map((option) => (
          <div
            key={option.texto}
            className="border border-gray-200 rounded-lg bg-gray-50 aspect-square flex flex-col items-center justify-center text-center gap-1"
          >
            <p className="text-sm font-medium text-gray-600 text-center">
              {option.texto}
            </p>
            <p className="text-3xl font-semibold text-gray-900">
              {formatPercent(option.porcentaje)}
            </p>
            <p className="text-xs text-gray-500">
              {option.total} de {totalResponses}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

interface OpenResponsesSummaryProps {
  sections: EstadisticasSeccion[];
}

const OpenQuestionCard: React.FC<{ pregunta: EstadisticasPreguntaAbierta }> = ({
  pregunta,
}) => (
  <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm">
    <h4 className="text-sm font-semibold text-gray-800">{pregunta.texto}</h4>
    <p className="text-xs text-gray-500 mb-2">
      {pregunta.total_respuestas} respuestas
    </p>
    {pregunta.ejemplos.length > 0 ? (
      <ul className="space-y-2 text-sm text-gray-700">
        {pregunta.ejemplos.map((ejemplo, index) => (
          <li
            key={`${pregunta.pregunta_id}-${index}`}
            className="rounded bg-gray-50 p-2"
          >
            “{ejemplo}”
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-gray-500">
        Todavía no hay comentarios registrados.
      </p>
    )}
  </div>
);

export const OpenResponsesSummary: React.FC<OpenResponsesSummaryProps> = ({
  sections,
}) => {
  const seccionesConAbiertas = sections.filter(
    (section) => section.preguntas_abiertas.length > 0,
  );

  if (seccionesConAbiertas.length === 0) {
    return null;
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-800">
          Respuestas destacadas
        </h3>
        <p className="text-sm text-gray-500">
          Comentarios mas recientes.
        </p>
      </div>
      <div className="space-y-6">
        {seccionesConAbiertas.map((section) => (
          <article key={section.id} className="space-y-3">
            <header className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                {section.nombre}
              </h4>
              <span className="text-xs text-gray-500">
                {section.total_respuestas_abiertas} comentarios
              </span>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              {section.preguntas_abiertas.map((pregunta) => (
                <OpenQuestionCard key={pregunta.pregunta_id} pregunta={pregunta} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
