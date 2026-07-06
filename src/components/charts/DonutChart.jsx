import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function DonutChartCard({ title, data, height = 240, colors = ['var(--sn-purple)', 'var(--sn-blue)', 'var(--sn-amber)', 'var(--sn-purple)', 'var(--sn-red)'] }) {
  return (
    <div className="rounded-2xl border border-[var(--sn-border)] p-5" style={{ background: 'var(--sn-card)' }}>
      {title && <h3 className="text-sm font-bold text-[var(--sn-text)] mb-4">{title}</h3>}
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--sn-card)', border: '1px solid var(--sn-border)', borderRadius: '12px',
                fontSize: '12px', color: 'var(--sn-text)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
              <span className="text-[var(--sn-text-secondary)] flex-1">{item.name}</span>
              <span className="text-[var(--sn-text)] font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
