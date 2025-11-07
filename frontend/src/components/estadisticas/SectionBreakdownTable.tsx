import React, { useState } from "react";
import type {
  ResultadoSeccion,
  ResultadoPregunta,
  ResultadoOpcion,
} from "../../types/estadisticas";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

// --- Tipos de Props ---

interface SeriesMap {
  [key: string]: { label: string; color: string };
}

interface QuestionBreakdownProps {
  pregunta: ResultadoPregunta;
  seriesMap: SeriesMap;
}

interface SectionBreakdownTableProps {
  secciones: ResultadoSeccion[];
  seriesMap: SeriesMap;
}

// --- Sub-componente para una Pregunta ---

const QuestionBreakdown: React.FC<QuestionBreakdownProps> = ({
  pregunta,
  seriesMap,
}) => {
  if (pregunta.pregunta_tipo === "REDACCION") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800">
          {pregunta.pregunta_texto}
        </h4>
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {pregunta.respuestas_texto?.map((resp, index) => (
            <p
              key={index}
              className="text-sm text-gray-600 italic border-b pb-1"
            >
              "{resp.texto}"
            </p>
          ))}
        </div>
      </div>
    );
  }

  // Si es Multiple Choice
  const questionTotal = (pregunta.resultados_opciones || []).reduce(
    (sum, opt) => sum + opt.cantidad,
    0
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800">
          {pregunta.pregunta_texto}
        </h4>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {questionTotal} respuestas
        </span>
      </header>
      <div className="mt-4 space-y-3">
        {(pregunta.resultados_opciones || []).map((opcion) => {
          const percent =
            questionTotal === 0 ? 0 : (opcion.cantidad / questionTotal) * 100;
          const serie = seriesMap[opcion.opcion_texto.trim().toLowerCase()];
          const color = serie ? serie.color : "#8884d8";

          return (
            <div key={opcion.opcion_id} className="space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-gray-600">
                  {opcion.opcion_texto}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatPercent(percent)}
                  <span className="ml-2 text-[11px] font-normal text-gray-500">
                    {opcion.cantidad} resp.
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Componente Principal de la Tabla Acordeón ---

const SectionBreakdownTable: React.FC<SectionBreakdownTableProps> = ({
  secciones,
  seriesMap,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    secciones[0]?.seccion_nombre ?? null
  );

  const toggleSection = (sectionName: string) => {
    setExpandedSection((current) =>
      current === sectionName ? null : sectionName
    );
  };

  const getTotalRespuestasPorSeccion = (seccion: ResultadoSeccion) => {
    // Suma el total de la primera pregunta (que suele ser la más representativa)
    // o puedes sumar todas, pero aquí solo usamos el 'count' de la encuesta
    return seccion.resultados_por_pregunta.length > 0
      ? (seccion.resultados_por_pregunta[0].resultados_opciones || []).reduce(
          (s, o) => s + o.cantidad,
          0
        )
      : 0;
  };

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">
        Respuestas por sección
      </h3>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Sección</th>
              <th className="px-6 py-3 text-right font-semibold">
                Total respuestas (aprox)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {secciones.map((seccion) => {
              const isOpen = expandedSection === seccion.seccion_nombre;
              const sectionTotal = getTotalRespuestasPorSeccion(seccion);

              return (
                <React.Fragment key={seccion.seccion_nombre}>
                  <tr
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection(seccion.seccion_nombre)}
                    className="cursor-pointer transition hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-100"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-500">
                          {isOpen ? "−" : "+"}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {seccion.seccion_nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                      {sectionTotal} resp.
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={`section-panel-${seccion.seccion_nombre}`}>
                      <td colSpan={3} className="bg-gray-50 px-6 pb-6 pt-4">
                        <div className="space-y-4">
                          {seccion.resultados_por_pregunta.map((pregunta) => (
                            <QuestionBreakdown
                              key={pregunta.pregunta_id}
                              pregunta={pregunta}
                              seriesMap={seriesMap}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SectionBreakdownTable;
