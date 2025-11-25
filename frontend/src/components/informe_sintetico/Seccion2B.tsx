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
  instanciaId: string;
}

const Seccion2B: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  const subCols = ["B", "C", "D", "ET", "EP"];
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th rowSpan={2} className="px-2 py-3 text-left w-[25%]">
              Actividad curricular
            </th>
            <th colSpan={5} className="px-2 py-1 text-center border-b">
              Encuesta a alumnos
            </th>
            <th rowSpan={2} className="px-2 py-3 text-center w-[30%]">
              Juicio de Valor
            </th>
          </tr>
          <tr>
            {subCols.map((c) => (
              <th key={c} className="px-1 text-center text-xs">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materiasFiltradas.map((m) => (
            <tr key={m.id} className="group hover:bg-gray-50">
              <td className="px-2 py-3 font-medium">{m.materia_nombre}</td>
              {subCols.map((col) => (
                <td key={col} className="px-1 py-1">
                  <input
                    type="text"
                    className="w-full text-center border rounded text-xs h-8"
                    value={respuestas[`p${preguntaId}_m${m.id}_${col}`] || ""}
                    onChange={(e) =>
                      handleInputChange(
                        `p${preguntaId}_m${m.id}_${col}`,
                        e.target.value
                      )
                    }
                  />
                </td>
              ))}
              <td className="px-2 py-3 relative">
                <textarea
                  className="w-full border rounded p-1 text-xs h-16 resize-none"
                  value={respuestas[`p${preguntaId}_m${m.id}_juicio`] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      `p${preguntaId}_m${m.id}_juicio`,
                      e.target.value
                    )
                  }
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                  <BotonTraerRespuestas
                    instanciaId={instanciaId}
                    seccionPrefijo="2.B"
                    materiaId={m.materia_id}
                    mini={true}
                    onCopy={(t) =>
                      handleInputChange(`p${preguntaId}_m${m.id}_juicio`, t)
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Seccion2B;
