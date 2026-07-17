import { ResponsiveContainer, LineChart, Line } from 'recharts';

export function Sparkline({ data, dataKey = 'value', color = 'var(--az-accent)', height = 40, width = 120 }) {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
