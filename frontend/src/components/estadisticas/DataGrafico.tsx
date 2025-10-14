import React from 'react';
import { chartData, responseSeries } from './chartData';

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const sectionSummaries = chartData.map((section) => {
  const total = responseSeries.reduce((sum, serie) => sum + section[serie.key], 0);

  const breakdown = responseSeries.map((serie) => {
    const value = section[serie.key];
    const percent = total === 0 ? 0 : (value / total) * 100;
    return {
      ...serie,
      value,
      percent,
    };
  });

  return {
    name: section.name,
    total,
    breakdown,
  };
});

const totalResponses = sectionSummaries.reduce((sum, section) => sum + section.total, 0);

const optionTotals = responseSeries.map((serie) => {
  const total = chartData.reduce((sum, section) => sum + section[serie.key], 0);
  const percent = totalResponses === 0 ? 0 : (total / totalResponses) * 100;
  return {
    ...serie,
    total,
    percent,
  };
});

export const SectionBreakdown: React.FC = () => (
  <section className="bg-white p-5 rounded-xl shadow-sm">
    <h3 className="text-base font-semibold text-gray-800 mb-3">
      Porcentaje por sección
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Sección</th>
            {responseSeries.map((serie) => (
              <th key={serie.key} className="px-4 py-2 text-left font-medium">
                {serie.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-700">
          {sectionSummaries.map((section) => (
            <tr key={section.name}>
              <td className="px-4 py-3 font-medium text-gray-800">{section.name}</td>
              {section.breakdown.map((serie) => (
                <td key={serie.key} className="px-4 py-3">
                  <p className="font-medium text-gray-800">{formatPercent(serie.percent)}</p>
                  <p className="text-[11px] text-gray-500">{serie.value} resp.</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const OptionTotals: React.FC = () => (
  <section className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-base font-semibold text-gray-800 mb-4">
      Porcentaje total por opción
    </h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {optionTotals.map((option) => (
        <div
          key={option.key}
          className="border border-gray-200 rounded-lg bg-gray-50 aspect-square flex flex-col items-center justify-center text-center gap-1"
        >
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {option.label}
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {formatPercent(option.percent)}
          </p>
          <p className="text-xs text-gray-500">
            {option.total} de {totalResponses}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export const DataGrafico: React.FC = () => (
  <div className="flex flex-col gap-4">
    <SectionBreakdown />
    <OptionTotals />
  </div>
);

export default DataGrafico;
