import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function BarChartCard({ title, data, xKey, bars = [{ key, label, color }], height = 240, formatY, layout = 'horizontal' }) {
  const gridColor = 'var(--sn-border)';
  const axisColor = 'var(--sn-text-muted)';

  return (
    <div className="rounded-2xl border border-[var(--sn-border)] p-5" style={{ background: 'var(--sn-card)' }}>
      {title && <h3 className="text-sm font-bold text-[var(--sn-text)] mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RBarChart data={data} layout={layout} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} strokeOpacity={0.5} vertical={layout === 'vertical'} horizontal={layout === 'horizontal'} />
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey={xKey} stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatY} width={60} />
            </>
          ) : (
            <>
              <XAxis type="number" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatY} />
              <YAxis type="category" dataKey={xKey} stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: 'var(--sn-card)', border: '1px solid var(--sn-border)', borderRadius: '12px',
              fontSize: '12px', color: 'var(--sn-text)',
            }}
          />
          {bars.map(bar => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[6, 6, 0, 0]} />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
