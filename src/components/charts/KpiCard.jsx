import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function KpiCard({ label, value, delta, deltaType = 'positive', sparkData, icon: Icon, color = 'var(--sn-purple)', loading }) {
  if (loading) return <div className="rounded-2xl border border-[var(--sn-border)] h-32 sn-shimmer" />;
  const DeltaIcon = deltaType === 'positive' ? TrendingUp : TrendingDown;
  const deltaColor = deltaType === 'positive' ? 'var(--sn-purple)' : 'var(--sn-red)';

  return (
    <div className="rounded-2xl border border-[var(--sn-border)] p-5" style={{ background: 'var(--sn-card)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--sn-text)] sn-mono">{value}</p>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>
      {delta && (
        <div className="flex items-center gap-1.5 text-xs">
          <DeltaIcon className="w-3.5 h-3.5" style={{ color: deltaColor }} />
          <span style={{ color: deltaColor }} className="font-semibold">{delta}</span>
          <span className="text-[var(--sn-text-muted)]">vs last period</span>
        </div>
      )}
    </div>
  );
}
