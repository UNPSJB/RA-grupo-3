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

const Seccion2C: React.FC<Props> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
  instanciaId,
}) => {
  const cols = [
    "aspectospositivos_procesodeenseñanza",
    "aspectospositivos_procesodeaprendizaje",
    "obstáculos_procesoenseñanza",
    "obstáculos_procesodeaprendizaje",
    "estrategiasaimplementar",
  ];

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-3">Materia</th>
            <th className="px-2">Positivos (E)</th>
            <th className="px-2">Positivos (A)</th>
            <th className="px-2">Obstáculos (E)</th>
            <th className="px-2">Obstáculos (A)</th>
            <th className="px-2">Estrategias</th>
          </tr>
        </thead>
        <tbody>
          {materiasFiltradas.map((m) => (
            <tr key={m.id} className="group hover:bg-gray-50">
              <td className="px-2 py-3 font-medium">{m.materia_nombre}</td>
              {cols.map((col) => (
                <td key={col} className="px-1 py-2 relative">
                  <textarea
                    className="w-full border rounded p-1 h-12"
                    value={respuestas[`p${preguntaId}_m${m.id}_${col}`] || ""}
                    onChange={(e) =>
                      handleInputChange(
                        `p${preguntaId}_m${m.id}_${col}`,
                        e.target.value
                      )
                    }
                  />
                  {/* Nota: Seccion 2C trae TODO el texto de 2.C junto. El profesor debera recortar lo que no va. */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                    <BotonTraerRespuestas
                      instanciaId={instanciaId}
                      seccionPrefijo="2.C"
                      materiaId={m.materia_id}
                      mini={true}
                      onCopy={(t) =>
                        handleInputChange(`p${preguntaId}_m${m.id}_${col}`, t)
                      }
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Seccion2C;
