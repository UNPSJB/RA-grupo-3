import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";

interface RadarChartData {
  subject: string;
  score: number;
  fullMark: number;
}

interface RadarChartGeneralProps {
  data: RadarChartData[];
  title: string;
}

const RadarChartGeneral: React.FC<RadarChartGeneralProps> = ({
  data,
  title,
}) => {
  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />

          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 14, fontWeight: "bold" }}
          />

          <PolarRadiusAxis
            domain={[1, 4]}
            tickCount={4}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
          />

          <Radar
            name="Promedio de Evaluación"
            dataKey="score"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.6}
          />

          <Tooltip
            formatter={(value: number) => [
              `${value.toFixed(2)} / 4.00`,
              "Promedio",
            ]}
          />

          <Legend wrapperStyle={{ paddingTop: "20px" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartGeneral;
