import React from 'react';
import { getOptionTotals, getTotalResponses } from './chartData';

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const OptionTotalsSummary: React.FC = () => {
  const optionTotals = getOptionTotals();
  const totalResponses = getTotalResponses();

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Porcentaje total por opción</h3>
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
};

export default OptionTotalsSummary;
