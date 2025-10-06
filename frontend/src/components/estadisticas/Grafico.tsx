import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartData, responseSeries } from './chartData';

const Grafico = () => {
  const legendPayload = responseSeries.map(({ key, label, color }) => ({
    value: label,
    type: 'square',
    color,
    id: key,
  }));

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          width={500}
          height={320}
          data={chartData}
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
            formatter={(value, name) => {
              const serieKey = typeof name === 'string' ? name : String(name);
              const match = responseSeries.find((item) => item.key === serieKey);
              return [value, match ? match.label : serieKey];
            }}
          />
          <Legend />
          {responseSeries.map(({ key, label, color }) => (
            <Bar key={key} dataKey={key} name={label} stackId="a" fill={color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Grafico;
