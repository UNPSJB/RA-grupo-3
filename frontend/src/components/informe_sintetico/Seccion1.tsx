// frontend/src/components/informe_sintetico/Seccion1.tsx
import React from "react";
import { BotonTraerRespuestas } from "./BotonTraerRespuesta";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
  materia_id: number; // Asegúrate de que venga este dato
}

interface Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, value: string) => void;
  preguntaId: number;
  instanciaId: string;
}

const Seccion1: React.FC<Props> = ({
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
              <th className="px-4 py-3 text-left w-[20%]">
                Actividad Curricular
              </th>
              <th className="px-4 py-3 text-left w-[40%]">
                Equipamiento e Insumos
              </th>
              <th className="px-4 py-3 text-left w-[40%]">Bibliografía</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materiasFiltradas.map((m) => {
              const keyEquip = `p${preguntaId}_m${m.id}_equipamiento`;
              const keyBiblio = `p${preguntaId}_m${m.id}_bibliografia`;

              return (
                <tr
                  key={m.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-100 align-top">
                    {m.materia_nombre}
                  </td>

                  {/* CELDA EQUIPAMIENTO */}
                  <td className="px-2 py-2 border-r border-gray-100 relative align-top group">
                    <div className="relative">
                      <textarea
                        className="w-full h-20 border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y pr-8"
                        placeholder="Detalle equipamiento..."
                        value={respuestas[keyEquip] || ""}
                        onChange={(e) =>
                          handleInputChange(keyEquip, e.target.value)
                        }
                      />
                      {/* Botón flotante dentro del input */}
                      <div className="absolute top-1 right-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <BotonTraerRespuestas
                          instanciaId={instanciaId}
                          seccionPrefijo="1." // Busca en toda la sección 1
                          materiaId={m.materia_id} // Filtra por esta materia
                          mini={true}
                          onCopy={(txt) => handleInputChange(keyEquip, txt)}
                        />
                      </div>
                    </div>
                  </td>

                  {/* CELDA BIBLIOGRAFÍA */}
                  <td className="px-2 py-2 relative align-top group">
                    <div className="relative">
                      <textarea
                        className="w-full h-20 border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y pr-8"
                        placeholder="Detalle bibliografía..."
                        value={respuestas[keyBiblio] || ""}
                        onChange={(e) =>
                          handleInputChange(keyBiblio, e.target.value)
                        }
                      />
                      <div className="absolute top-1 right-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <BotonTraerRespuestas
                          instanciaId={instanciaId}
                          seccionPrefijo="1." // Nota: El backend traerá todo lo de sec 1. Si quieres separar Equip. de Biblio, necesitarías lógica extra en backend.
                          materiaId={m.materia_id}
                          mini={true}
                          onCopy={(txt) => handleInputChange(keyBiblio, txt)}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Seccion1;
