import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import type { ChartDatum, SeriesDescriptor } from './chartData';

interface GraficoProps {
  data: ChartDatum[];
  series: SeriesDescriptor[];
}

const Grafico: React.FC<GraficoProps> = ({ data, series }) => {
  if (data.length === 0 || series.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-500">
        No hay respuestas suficientes para graficar.
      </div>
    );
  }

  const legendPayload = series.map(({ key, label, color }) => ({
    value: label,
    type: 'square' as const,
    color,
    id: key,
  }));

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          width={500}
          height={320}
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 12 }} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => [value, name]}
            cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
          />
          <Legend payload={legendPayload} />
          {series.map(({ key, label, color }) => (
            <Bar
              key={key}
              dataKey={key}
              name={label}
              stackId="a"
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Grafico;
