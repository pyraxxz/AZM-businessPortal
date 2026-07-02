/**
 * Widget — Sentry-inspired dashboard widget card.
 * Each widget is a self-contained data card with a header, optional actions,
 * and content area. Used in the widget-based dashboard layout.
 *
 * Sentry design tenets applied:
 * - Placeholders instead of loading spinners (loading prop renders skeleton)
 * - Disable (and explain), don't hide (error prop shows inline, not removed)
 * - Data-dense, tactile feel
 */
import { cn } from '@/lib/utils';
import { MoreHorizontal, Maximize2, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from './index';

export function Widget({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = '#00d97e',
  actions, 
  children, 
  loading, 
  error,
  className,
  height,
  onExpand,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#1e1e2e] overflow-hidden flex flex-col',
        'transition-all duration-200 hover:border-[#2a2a3e]',
        className
      )}
      style={{ background: 'var(--az-card)', minHeight: height }}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${iconColor}1a`, border: `1px solid ${iconColor}30` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#e8e8f0] leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#4a4a6a] mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#7b7b9a] transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget body */}
      <div className="flex-1 p-5">
        {loading ? (
          <Skeleton className="h-full min-h-[80px]" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center">
            <p className="text-xs text-[#f43f5e] font-medium">{error}</p>
            <p className="text-[11px] text-[#4a4a6a] mt-1">Try refreshing the page</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/** Widget stat — a single large number with optional trend indicator */
export function WidgetStat({ value, label, trend, trendValue, color = '#e8e8f0' }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold az-mono" style={{ color }}>{value}</span>
      {label && <span className="text-[11px] text-[#4a4a6a] mt-0.5">{label}</span>}
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 text-[#00d97e]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-[#f43f5e]" />
          )}
          <span className={cn('text-[11px] font-semibold', trend === 'up' ? 'text-[#00d97e]' : 'text-[#f43f5e]')}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

/** Widget row — a row in a data-dense widget list */
export function WidgetRow({ label, value, badge, onClick, color }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2.5 border-b border-[#1e1e2e] last:border-0',
        onClick && 'cursor-pointer hover:bg-[#0f0f17] transition-colors -mx-5 px-5'
      )}
      onClick={onClick}
    >
      <span className="text-xs text-[#7b7b9a] font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {badge}
        <span className="text-xs font-bold text-[#e8e8f0] az-mono" style={color ? { color } : undefined}>{value}</span>
      </div>
    </div>
  );
}
