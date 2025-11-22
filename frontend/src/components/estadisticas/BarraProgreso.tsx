import React from "react";

interface BarraProgresoProps {
  actual: number;
  total: number;
}

const BarraProgreso: React.FC<BarraProgresoProps> = ({ actual, total }) => {
  // Calculamos el porcentaje (evitando división por cero)
  const porcentaje =
    total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  return (
    <div className="w-full mb-6 px-1">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-indigo-700">Tu Progreso</span>
        <span className="text-sm font-medium text-indigo-700">
          {porcentaje}%
        </span>
      </div>

      {/* Barra Fondo Gris */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        {/* Barra Relleno (Animada) */}
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1 text-right">
        Has respondido {actual} de {total} preguntas
      </p>
    </div>
  );
};

export default BarraProgreso;
