import { Badge } from '@/components/ui';
import { Lock, Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetPalette({ widgets, eligibility, onAdd, isLocked }) {
  const categories = ['HEADER', 'CONTENT', 'COMMERCE', 'SOCIAL', 'MEDIA'];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-4 h-4 text-az-text-muted" />
        <h2 className="text-sm font-bold text-az-text uppercase tracking-wider">Widgets</h2>
      </div>

      {categories.map(cat => {
        const catWidgets = widgets.filter(w => w.category === cat);
        if (catWidgets.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-xs font-semibold text-az-text-muted uppercase tracking-wide mb-2">{cat}</p>
            <div className="space-y-1.5">
              {catWidgets.map(widget => {
                const locked = isLocked(widget.widgetType);
                return (
                  <button
                    key={widget.id}
                    disabled={locked}
                    onClick={() => onAdd(widget.widgetType, widget.defaultProps)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left',
                      'border border-az-border bg-az-surface hover:border-az-border-strong hover:shadow-az-card',
                      locked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--az-accent-subtle)' }}
                    >
                      {locked ? <Lock className="w-4 h-4 text-az-text-muted" /> : <Plus className="w-4 h-4 text-az-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-az-text truncate">{widget.displayName}</p>
                      {widget.minAzmStake > 0 && (
                        <p className="text-xs text-az-text-muted">
                          {locked ? `Stake ${widget.minAzmStake} AZM` : 'Premium'}
                        </p>
                      )}
                    </div>
                    {widget.minAzmStake > 0 && (
                      <Badge variant={locked ? 'danger' : 'primary'}>
                        {widget.tier?.replace('NITRO_', '') || ''}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
