import React from 'react';
import { getQuestionTotal, responseSeries, sectionsData } from './chartData';

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const SectionBreakdownTable: React.FC = () => {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(
    sectionsData[0]?.id ?? null,
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSection((current) => (current === sectionId ? null : sectionId));
  };

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Respuestas por sección</h3>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Sección</th>
              <th className="px-6 py-3 text-left font-semibold hidden sm:table-cell">
                Descripción
              </th>
              <th className="px-6 py-3 text-right font-semibold">Total respuestas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sectionsData.map((section) => {
              const isOpen = expandedSection === section.id;
              const sectionTotal = section.questions.reduce(
                (sum, question) => sum + getQuestionTotal(question),
                0,
              );

              return (
                <React.Fragment key={section.id}>
                  <tr
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection(section.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleSection(section.id);
                      }
                    }}
                    aria-expanded={isOpen}
                    aria-controls={`section-panel-${section.id}`}
                    className="cursor-pointer transition hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-100"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-500">
                          {isOpen ? '-' : '+'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 hidden sm:table-cell">
                      {section.description ?? 'Sin descripción'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                      {sectionTotal} resp.
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={`section-panel-${section.id}`}>
                      <td colSpan={3} className="bg-gray-50 px-6 pb-6 pt-4">
                        <div className="space-y-4">
                          {section.questions.map((question) => {
                            const questionTotal = getQuestionTotal(question);

                            return (
                              <div
                                key={question.id}
                                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                              >
                                <header className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-gray-800">
                                    {question.question}
                                  </h4>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {questionTotal} respuestas
                                  </span>
                                </header>
                                <div className="mt-4 space-y-3">
                                  {responseSeries.map((serie) => {
                                    const count = question[serie.key];
                                    const percent =
                                      questionTotal === 0 ? 0 : (count / questionTotal) * 100;

                                    return (
                                      <div key={serie.key} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs sm:text-sm">
                                          <span className="font-medium text-gray-600">
                                            {serie.label}
                                          </span>
                                          <span className="font-semibold text-gray-900">
                                            {formatPercent(percent)}
                                            <span className="ml-2 text-[11px] font-normal text-gray-500">
                                              {count} resp.
                                            </span>
                                          </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                          <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                              width: `${percent}%`,
                                              backgroundColor: serie.color,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
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
