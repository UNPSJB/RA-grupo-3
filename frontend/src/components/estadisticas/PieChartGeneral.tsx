import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Tipos de Datos ---
interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartGeneralProps {
  data: PieChartData[];
  title: string;
}

// --- Componente ---
const PieChartGeneral: React.FC<PieChartGeneralProps> = ({ data, title }) => {
  const renderLabel = (entry: PieChartData) => {
    return `${entry.name} (${entry.value})`;
  };

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartGeneral;
