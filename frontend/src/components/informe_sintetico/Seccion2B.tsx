import React from "react";

interface Materia {
  id: number;
  materia_nombre: string;
}

interface Seccion2BProps {
  materiasFiltradas: Materia[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, valor: string) => void;
  preguntaId: number;
}

const Seccion2B: React.FC<Seccion2BProps> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
}) => {
  const subCols = ["B", "C", "D", "ET", "EP"];
  
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th rowSpan={2} className="px-2 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-[10%] border-r border-gray-200">Código actividad curricular</th>
              <th rowSpan={2} className="px-2 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-[25%] border-r border-gray-200">Actividad curricular</th>
              <th colSpan={5} className="px-2 py-1 text-center font-bold text-gray-700 uppercase tracking-wider border-b border-gray-300 border-r border-gray-200">Encuesta a alumnos</th>
              <th rowSpan={2} className="px-2 py-3 text-center font-bold text-gray-700 uppercase tracking-wider w-[20%]">Juicio de Valor *</th>
            </tr>
            <tr>
              {subCols.map((col, index) => (
                <th 
                  key={col} 
                  className={`px-1 py-1 text-center font-bold text-gray-600 uppercase tracking-wider w-[7%] border-r border-gray-200 ${index === subCols.length - 1 ? 'last:border-r-0' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-3 align-top font-mono text-gray-600 text-center border-r border-gray-200">{m.id}</td>
                <td className="px-2 py-3 align-top font-medium text-gray-900 border-r border-gray-200">{m.materia_nombre}</td>
                {subCols.map((col, index) => (
                  <td 
                    key={col} 
                    className={`px-1 py-1 align-top border-r border-gray-200 ${index === subCols.length - 1 ? 'last:border-r-0' : ''}`}
                  >
                    <input
                      type="text"
                      className="w-full h-8 border border-gray-300 rounded p-1 text-center text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={respuestas[`p${preguntaId}_m${m.id}_${col}`] || ""}
                      onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_${col}`, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-2 py-3 align-top">
                  <textarea
                    className="w-full h-10 border border-gray-300 rounded p-1 resize-none text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    value={respuestas[`p${preguntaId}_m${m.id}_juicio`] || ""}
                    onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_juicio`, e.target.value)}
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

export default Seccion2B;


