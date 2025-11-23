import React from "react";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
}

interface Seccion2Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, valor: string) => void;
  preguntaId: number;
}

const Seccion2: React.FC<Seccion2Props> = ({ materiasFiltradas, respuestas, handleInputChange, preguntaId }) => {
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-1/6 border-r border-gray-200">Código actividad curricular</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-2/6 border-r border-gray-200">Actividad curricular</th>
              <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider w-1/6 border-r border-gray-200">Horas dictadas</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-2/6">Justificación</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 align-top font-mono text-gray-600 w-1/6 border-r border-gray-200">{m.id}</td>
                <td className="px-4 py-3 align-top font-medium text-gray-900 w-2/6 border-r border-gray-200">{m.materia_nombre}</td>
                <td className="px-4 py-3 align-top w-1/6 border-r border-gray-200">
                  <input
                    type="text"
                    className="w-full h-8 border border-gray-300 rounded p-1 text-center text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={respuestas[`p${preguntaId}_m${m.id}_h`] || ""}
                    onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_h`, e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 align-top w-2/6">
                  <textarea
                    className="w-full h-10 border border-gray-300 rounded p-1 resize-none text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    value={respuestas[`p${preguntaId}_m${m.id}_j`] || ""}
                    onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_j`, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Seccion2;