import React from "react";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
  profesor_nombre: string;
}

interface Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, value: string) => void;
  preguntaId: number;
}

const Seccion3: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
}) => {
  
  const getKey = (materiaId: number, campo: string) => 
    `${preguntaId}-${materiaId}-${campo}`;
  const onCheckboxChange = (materiaId: number, campo: string, checked: boolean) => {
    handleInputChange(getKey(materiaId, campo), checked ? "true" : "false");
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              rowSpan={2}
              className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-1/6"
            >
              Espacio Curricular
            </th>
            <th
              scope="col"
              rowSpan={2}
              className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-1/6"
            >
              Responsable / Equipo
            </th>
            <th
              scope="col"
              colSpan={4}
              className="px-4 py-2 text-center font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200"
            >
              Desarrollo de actividades
            </th>
            <th
              scope="col"
              rowSpan={2}
              className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider w-1/4"
            >
              Observaciones-Comentarios
            </th>
          </tr>
          <tr>
            <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200 text-xs uppercase">
              Capacitación
            </th>
            <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200 text-xs uppercase">
              Investigación
            </th>
            <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200 text-xs uppercase">
              Extensión
            </th>
            <th className="px-2 py-2 text-center font-medium text-gray-600 text-xs uppercase">
              Gestión
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {materiasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500 italic">
                No hay materias disponibles para listar.
              </td>
            </tr>
          ) : (
            materiasFiltradas.map((materia) => (
              <tr key={materia.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                  {materia.materia_nombre}
                  <div className="text-xs text-gray-400 font-mono mt-1">ID: {materia.id}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 border-r border-gray-100 text-xs">
                  {materia.profesor_nombre}
                </td>
                {["capacitacion", "investigacion", "extension", "gestion"].map((campo) => (
                  <td key={campo} className="px-2 py-2 border-r border-gray-100 text-center bg-gray-50/30">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        checked={respuestas[getKey(materia.id, campo)] === "true"}
                        onChange={(e) => onCheckboxChange(materia.id, campo, e.target.checked)}
                      />
                    </div>
                  </td>
                ))}
                <td className="px-2 py-2">
                  <textarea
                    rows={2}
                    className="w-full border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 border p-1 resize-none"
                    placeholder="Comentarios..."
                    value={respuestas[getKey(materia.id, "observaciones")] || ""}
                    onChange={(e) => handleInputChange(getKey(materia.id, "observaciones"), e.target.value)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Seccion3;