import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ProgresoDonutChartProps {
  completadas: number;
  pendientes: number;
}

const ProgresoDonutChart: React.FC<ProgresoDonutChartProps> = ({
  completadas,
  pendientes,
}) => {
  const data = [
    { name: "Completadas", value: completadas, color: "#4ade80" }, // Verde suave
    { name: "Sin Responder", value: pendientes, color: "#f87171" }, // Rojo suave
  ];

  const total = completadas + pendientes;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center h-80 relative">
      <h3 className="text-lg font-bold text-gray-700 absolute top-4 left-6">
        Progreso de Encuestas
      </h3>

      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Texto Central */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-3">
          <p className="text-3xl font-extrabold text-gray-800">{porcentaje}%</p>
          <p className="text-xs text-gray-500">Completado</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-6 mt-[-20px]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600 font-medium">
              {item.value} {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgresoDonutChart;
