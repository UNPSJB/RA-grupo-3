import React from "react";

interface Materia {
  id: number;
  materia_nombre: string;
}

interface Seccion2BProps {
  materiasFiltradas: Materia[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, valor: string) => void;
  preguntaId: number;
}

const Seccion2B: React.FC<Seccion2BProps> = ({
  materiasFiltradas,
  respuestas,
  handleInputChange,
  preguntaId,
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <p className="font-medium mb-3 text-gray-800">
        2.B. Completar tabla de Encuesta a alumnos y Juicio de Valor.
      </p>

      <div className="overflow-x-auto">
        {/* Encabezado */}
        <div className="flex font-bold bg-gray-100 p-2 rounded items-center">
          <div className="w-1/5 text-center">Código actividad curricular</div>
          <div className="w-2/5 text-center">Actividad curricular</div>
          <div className="w-5/12 flex flex-col">
            <div className="text-center mb-1">Encuesta a alumnos</div>
            <div className="flex justify-between">
              {["B", "C", "D", "ET", "EP"].map((col) => (
                <div key={col} className="w-1/5 text-center font-normal">{col}</div>
              ))}
            </div>
          </div>
          <div className="w-1/5 text-center">Juicio de Valor *</div>
        </div>

        {/* Filas */}
        {materiasFiltradas.map((m) => (
          <div key={m.id} className="flex border-b border-gray-200 p-2 items-start">
            <div className="w-1/5 text-center">{m.id}</div>
            <div className="w-2/5">{m.materia_nombre}</div>
            <div className="w-5/12 flex justify-between space-x-1">
              {["B", "C", "D", "ET", "EP"].map((col) => (
                <input
                  key={col}
                  type="text"
                  className="w-full h-10 border rounded p-1 text-center"
                  value={respuestas[`p${preguntaId}_m${m.id}_${col}`] || ""}
                  onChange={(e) =>
                    handleInputChange(`p${preguntaId}_m${m.id}_${col}`, e.target.value)
                  }
                  required
                />
              ))}
            </div>
            <div className="w-1/5">
              <textarea
                className="w-full h-10 border rounded p-1 resize-none"
                rows={1}
                value={respuestas[`p${preguntaId}_m${m.id}_juicio`] || ""}
                onChange={(e) =>
                  handleInputChange(`p${preguntaId}_m${m.id}_juicio`, e.target.value)
                }
                required
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Seccion2B;


