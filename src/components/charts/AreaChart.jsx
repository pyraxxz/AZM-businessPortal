import { ResponsiveContainer, AreaChart as RAreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AreaChartCard({ title, data, xKey, yKey, color = 'var(--sn-purple)', height = 240, formatY }) {
  const gridColor = 'var(--sn-border)';
  const axisColor = 'var(--sn-text-muted)';

  return (
    <div className="rounded-2xl border border-[var(--sn-border)] p-5" style={{ background: 'var(--sn-card)' }}>
      {title && <h3 className="text-sm font-bold text-[var(--sn-text)] mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey={xKey} stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatY} width={60} />
          <Tooltip
            contentStyle={{
              background: 'var(--sn-card)', border: '1px solid var(--sn-border)', borderRadius: '12px',
              fontSize: '12px', color: 'var(--sn-text)',
            }}
            labelStyle={{ color: 'var(--sn-text-muted)' }}
          />
          <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} fill={`url(#grad-${yKey})`} />
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
