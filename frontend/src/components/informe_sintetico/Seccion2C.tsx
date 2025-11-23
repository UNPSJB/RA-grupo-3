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
  const subColumnsHeaders = ["Aspectos positivos", "Obstáculos"];
  const subColumnsTitles = ["Proceso de enseñanza", "Proceso de aprendizaje"];
  const normalizeKey = (str: string) => {
    return str.toLowerCase().replace(/\s/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-[20%] border-r border-gray-200">Espacio curricular</th>
              <th colSpan={2} className="px-4 py-2 text-center font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 border-b border-gray-300">Aspectos positivos</th>
              <th colSpan={2} className="px-4 py-2 text-center font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 border-b border-gray-300">Obstáculos</th>
              <th rowSpan={2} className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-[20%]">Estrategias a implementar</th>
            </tr>
            <tr>
              {subColumnsHeaders.flatMap((mainCol) => 
                subColumnsTitles.map((subCol) => (
                  <th 
                    key={`${mainCol}-${subCol}`} 
                    className={`px-2 py-2 text-center font-bold text-gray-500 uppercase text-xs tracking-wider w-[15%] border-r border-gray-200`}
                  >
                    {subCol}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 align-top font-medium text-gray-900 border-r border-gray-200">{m.materia_nombre}</td>
                {subColumnsHeaders.flatMap((mainCol) => 
                    subColumnsTitles.map((subCol) => {
                        const key = `${normalizeKey(mainCol)}_${normalizeKey(subCol)}`;
                        const respuestaKey = `p${preguntaId}_m${m.id}_${key}`;

                        return (
                            <td 
                                key={key} 
                                className={`px-2 py-3 align-top border-r border-gray-200`}
                            >
                                <textarea
                                    className="w-full h-10 border border-gray-300 rounded p-1 resize-none text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={2}
                                    value={respuestas[respuestaKey] || ""}
                                    onChange={(e) => handleInputChange(respuestaKey, e.target.value)}
                                />
                            </td>
                        );
                    })
                )}
                <td className="px-4 py-3 align-top">
                    <textarea
                        className="w-full h-10 border border-gray-300 rounded p-1 resize-none text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        value={respuestas[`p${preguntaId}_m${m.id}_estrategiasaimplementar`] || ""}
                        onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_estrategiasaimplementar`, e.target.value)}
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

export default Seccion2C;