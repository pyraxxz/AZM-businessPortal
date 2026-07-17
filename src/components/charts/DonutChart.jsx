import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function DonutChartCard({ title, data, height = 240, colors = ['var(--az-accent)', 'var(--az-success)', 'var(--az-warning)', 'var(--az-info)'] }) {
  return (
    <div className="bg-az-surface backdrop-blur-glass border border-az-border rounded-az-lg shadow-az-card p-6">
      {title && <h3 className="text-sm font-bold text-az-text mb-4">{title}</h3>}
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)', borderRadius: '6px',
                fontSize: '12px', color: 'var(--az-text)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
              <span className="text-az-text-secondary flex-1">{item.name}</span>
              <span className="text-az-text font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
