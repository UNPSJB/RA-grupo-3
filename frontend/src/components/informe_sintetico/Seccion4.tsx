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

const Seccion4: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  const getKey = (materiaId: number, campo: string) =>
    `${preguntaId}-${materiaId}-${campo}`;

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Materia</th>
            <th>Nombre Auxiliar</th>
            <th colSpan={5} className="text-center">
              Calif. (E-I)
            </th>
            <th className="w-1/3">Justificación</th>
          </tr>
        </thead>
        <tbody>
          {materiasFiltradas.map((m) => (
            <tr key={m.id} className="group hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{m.materia_nombre}</td>
              <td className="px-2">
                <input
                  type="text"
                  className="w-full border rounded p-1"
                  placeholder="Nombre..."
                  value={respuestas[getKey(m.id, "nombre_auxiliar")] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      getKey(m.id, "nombre_auxiliar"),
                      e.target.value
                    )
                  }
                />
              </td>
              {["E", "MB", "B", "R", "I"].map((calif) => (
                <td key={calif} className="px-1 text-center">
                  <input
                    type="checkbox"
                    checked={
                      respuestas[getKey(m.id, `calificacion_${calif}`)] ===
                      "true"
                    }
                    onChange={(e) =>
                      handleInputChange(
                        getKey(m.id, `calificacion_${calif}`),
                        e.target.checked ? "true" : "false"
                      )
                    }
                  />
                </td>
              ))}
              <td className="px-2 py-3 relative">
                <textarea
                  className="w-full border rounded p-1 h-16"
                  value={respuestas[getKey(m.id, "justificacion")] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      getKey(m.id, "justificacion"),
                      e.target.value
                    )
                  }
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                  <BotonTraerRespuestas
                    instanciaId={instanciaId}
                    seccionPrefijo="4."
                    materiaId={m.materia_id}
                    mini={true}
                    onCopy={(t) =>
                      handleInputChange(getKey(m.id, "justificacion"), t)
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
export default Seccion4;
