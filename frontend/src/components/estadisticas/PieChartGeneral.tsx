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

  valueSuffix?: string;
}

const PieChartGeneral: React.FC<PieChartGeneralProps> = ({
  data,
  title,
  valueSuffix = "",
}) => {
  const renderPercentLabel = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, percent, index } = props;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill={data[index].color}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-xs">
            <span
              className="w-3 h-3 mr-1.5"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">
              {entry.value}:{" "}
              <span className="font-medium text-gray-800">
                {entry.payload.value}
                {valueSuffix}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
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
            labelLine={false}
            label={renderPercentLabel}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value}${valueSuffix}`, name]}
          />
          {/* Usar la nueva leyenda personalizada */}
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartGeneral;
