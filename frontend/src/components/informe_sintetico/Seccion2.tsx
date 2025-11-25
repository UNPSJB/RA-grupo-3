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

const Seccion2: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Materia</th>
            <th className="px-4 py-3">Horas Dictadas</th>
            <th className="px-4 py-3">Justificación</th>
          </tr>
        </thead>
        <tbody>
          {materiasFiltradas.map((m) => (
            <tr key={m.id} className="group hover:bg-gray-50">
              <td className="px-4 py-3">{m.materia_nombre}</td>
              <td className="px-4 py-3 relative">
                <input
                  type="text"
                  className="w-full border rounded p-1"
                  value={respuestas[`p${preguntaId}_m${m.id}_h`] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      `p${preguntaId}_m${m.id}_h`,
                      e.target.value
                    )
                  }
                />
                <div className="absolute top-3 right-5 opacity-0 group-hover:opacity-100">
                  <BotonTraerRespuestas
                    instanciaId={instanciaId}
                    seccionPrefijo="2."
                    materiaId={m.materia_id}
                    mini={true}
                    onCopy={(t) =>
                      handleInputChange(`p${preguntaId}_m${m.id}_h`, t)
                    }
                  />
                </div>
              </td>
              <td className="px-4 py-3 relative">
                <textarea
                  className="w-full border rounded p-1"
                  rows={2}
                  value={respuestas[`p${preguntaId}_m${m.id}_j`] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      `p${preguntaId}_m${m.id}_j`,
                      e.target.value
                    )
                  }
                />
                <div className="absolute top-3 right-5 opacity-0 group-hover:opacity-100">
                  <BotonTraerRespuestas
                    instanciaId={instanciaId}
                    seccionPrefijo="2."
                    materiaId={m.materia_id}
                    mini={true}
                    onCopy={(t) =>
                      handleInputChange(`p${preguntaId}_m${m.id}_j`, t)
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
export default Seccion2;
