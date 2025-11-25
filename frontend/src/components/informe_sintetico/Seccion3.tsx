import React from "react";
import { BotonTraerRespuestas } from "./BotonTraerRespuesta";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
  materia_id: number;
  profesor_nombre: string;
}
interface Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, value: string) => void;
  preguntaId: number;
  instanciaId: string;
}

const Seccion3: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  const getKey = (materiaId: number, campo: string) =>
    `${preguntaId}-${materiaId}-${campo}`;
  const onCheckboxChange = (
    materiaId: number,
    campo: string,
    checked: boolean
  ) => handleInputChange(getKey(materiaId, campo), checked ? "true" : "false");

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Materia</th>
            <th>Cap.</th>
            <th>Inv.</th>
            <th>Ext.</th>
            <th>Ges.</th>
            <th className="w-1/3">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {materiasFiltradas.map((m) => (
            <tr key={m.id} className="group hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                {m.materia_nombre}
                <br />
                <span className="text-xs text-gray-500">
                  {m.profesor_nombre}
                </span>
              </td>
              {["capacitacion", "investigacion", "extension", "gestion"].map(
                (campo) => (
                  <td key={campo} className="text-center">
                    <input
                      type="checkbox"
                      checked={respuestas[getKey(m.id, campo)] === "true"}
                      onChange={(e) =>
                        onCheckboxChange(m.id, campo, e.target.checked)
                      }
                    />
                  </td>
                )
              )}
              <td className="px-4 py-3 relative">
                <textarea
                  className="w-full border rounded p-1 h-16"
                  value={respuestas[getKey(m.id, "observaciones")] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      getKey(m.id, "observaciones"),
                      e.target.value
                    )
                  }
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                  <BotonTraerRespuestas
                    instanciaId={instanciaId}
                    seccionPrefijo="3."
                    materiaId={m.materia_id}
                    mini={true}
                    onCopy={(t) =>
                      handleInputChange(getKey(m.id, "observaciones"), t)
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
export default Seccion3;
