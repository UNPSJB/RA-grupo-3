import React from "react";
import { BotonTraerRespuestas } from "./BotonTraerRespuesta";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
  materia_id: number;
}
interface Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, value: string) => void;
  preguntaId: number;
  instanciaId: string; // <--- Nuevo Prop
}

const Seccion0: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left w-[40%]">
                Actividad Curricular
              </th>
              <th className="px-2 py-3 text-center w-[20%]">Cant. Alumnos</th>
              <th className="px-2 py-3 text-center w-[20%]">Com. Teóricas</th>
              <th className="px-2 py-3 text-center w-[20%]">Com. Prácticas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => (
              <tr key={m.id} className="hover:bg-blue-50/30 group">
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {m.materia_nombre}
                </td>

                {/* Ejemplo: Botón en Cantidad Alumnos */}
                {["inscriptos", "teoricas", "practicas"].map((field) => {
                  const key = `p${preguntaId}_m${m.id}_${field}`;
                  return (
                    <td key={field} className="px-2 py-2 relative">
                      <input
                        type="text"
                        className="w-full text-center border border-gray-300 rounded p-1.5"
                        value={respuestas[key] || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <BotonTraerRespuestas
                          instanciaId={instanciaId}
                          seccionPrefijo="0."
                          materiaId={m.materia_id}
                          mini={true}
                          onCopy={(t) => handleInputChange(key, t)}
                        />
                      </div>
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
export default Seccion0;
