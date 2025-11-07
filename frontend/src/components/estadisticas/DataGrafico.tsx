import React from "react";
import type { SeriesDescriptor } from "./charData.ts";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

// --- Tipos de Datos (basados en tu código antiguo) ---

// Para OptionTotals
export interface OptionTotal {
  texto: string;
  total: number;
  percent: number;
  color: string;
}

// Para SectionBreakdown
interface SectionData {
  nombre: string;
  total: number;
  breakdown: Array<{
    key: string;
    label: string;
    value: number;
    percent: number;
  }>;
}

// Para OpenResponsesSummary
interface OpenResponseSection {
  nombre: string;
  respuestas: string[];
}

// --- Componente 1: SectionBreakdown (adaptado) ---

interface SectionBreakdownProps {
  sections: SectionData[];
  series: SeriesDescriptor[];
}

export const SectionBreakdown: React.FC<SectionBreakdownProps> = ({
  sections,
  series,
}) => (
  <section className="bg-white p-5 rounded-xl shadow-sm">
    <h3 className="text-base font-semibold text-gray-800 mb-3">
      Porcentaje por Pregunta
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Pregunta</th>
            {series.map((serie) => (
              <th key={serie.key} className="px-4 py-2 text-left font-medium">
                {serie.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-700">
          {sections.map((section) => (
            <tr key={section.nombre}>
              <td className="px-4 py-3 font-medium text-gray-800">
                {section.nombre}
              </td>
              {section.breakdown.map((serie) => (
                <td key={serie.key} className="px-4 py-3">
                  <p className="font-medium text-gray-800">
                    {formatPercent(serie.percent)}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {serie.value} resp.
                  </p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

// --- Componente 2: OptionTotals (adaptado) ---

interface OptionTotalsProps {
  totals: OptionTotal[];
  totalResponses: number;
}

export const OptionTotals: React.FC<OptionTotalsProps> = ({
  totals,
  totalResponses,
}) => (
  <section className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-base font-semibold text-gray-800 mb-4">
      Porcentaje total por opción
    </h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {totals.map((option) => (
        <div
          key={option.texto}
          className="border border-gray-200 rounded-lg bg-gray-50 aspect-square flex flex-col items-center justify-center text-center gap-1"
          style={{ borderLeft: `4px solid ${option.color}` }} // Añade color
        >
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {option.texto}
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

// --- Componente 3: OpenResponsesSummary (para texto) ---

interface OpenResponsesSummaryProps {
  sections: OpenResponseSection[];
}

export const OpenResponsesSummary: React.FC<OpenResponsesSummaryProps> = ({
  sections,
}) => {
  const openSections = sections.filter((s) => s.respuestas.length > 0);

  if (openSections.length === 0) {
    return null; // No renderiza nada si no hay respuestas abiertas
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm xl:col-span-2">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Respuestas Abiertas (Redacción)
      </h3>
      <div className="space-y-6">
        {openSections.map((section) => (
          <div key={section.nombre}>
            <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">
              {section.nombre}
            </h4>
            <ul className="list-disc list-inside space-y-2 pl-2 max-h-48 overflow-y-auto">
              {section.respuestas.map((texto, index) => (
                <li key={index} className="text-sm text-gray-600 italic">
                  "{texto}"
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
