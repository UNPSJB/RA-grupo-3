import React from "react";

interface Materia {
  id: number;
  materia_nombre: string;
}

interface Seccion2CProps {
  materiasFiltradas: Materia[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, valor: string) => void;
  preguntaId: number;
}

const Seccion2C: React.FC<Seccion2CProps> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
}) => {
  const columnas = ["Aspectos positivos", "Obstáculos", "Estrategias a implementar"];

  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-1/4 border-r border-gray-200">Espacio curricular</th>
              {columnas.map((col, index) => (
                <th 
                  key={col} 
                  className={`px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-1/4 ${index < columnas.length - 1 ? 'border-r border-gray-200' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 align-top font-medium text-gray-700 w-1/4 border-r border-gray-200">{m.materia_nombre}</td>
                {columnas.map((col, index) => {
                  const key = col.toLowerCase().replace(/\s/g, "");
                  const respuestaKey = `p${preguntaId}_m${m.id}_${key}`;

                  return (
                    <td 
                      key={col} 
                      className={`px-4 py-3 align-top w-1/4 ${index < columnas.length - 1 ? 'border-r border-gray-200' : ''}`}
                    >
                      <textarea
                        className="w-full h-10 border border-gray-300 rounded p-1 resize-none text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        value={respuestas[respuestaKey] || ""}
                        onChange={(e) => handleInputChange(respuestaKey, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Seccion2C;