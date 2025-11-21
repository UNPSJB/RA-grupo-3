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
  const columnas = ["Aspectos positivos", "Obstáculos", "Estrategias a implementar"];

  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <p className="font-medium mb-3 text-gray-800">
        2.C. Completar tabla de Espacio curricular, Aspectos positivos, Obstáculos y Estrategias a implementar
      </p>

      <div className="overflow-x-auto">
        {/* Encabezado */}
        <div className="flex font-bold bg-gray-100 p-2 rounded">
          <div className="w-1/5">Espacio curricular</div>
          {columnas.map((col, idx) => (
            <div key={idx} className="w-1/5 text-center">{col}</div>
          ))}
        </div>

        {/* Filas */}
        {materiasFiltradas.map((m) => (
          <div key={m.id} className="flex border-b border-gray-200 p-2 items-start">
            <div className="w-1/5">{m.materia_nombre}</div>
            {columnas.map((col) => (
              <input
                key={col}
                type="text"
                className="w-1/5 h-10 border rounded p-1 text-center"
                value={respuestas[`p${preguntaId}_m${m.id}_${col}`] || ""}
                onChange={(e) =>
                  handleInputChange(`p${preguntaId}_m${m.id}_${col}`, e.target.value)
                }
                required
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Seccion2C;

