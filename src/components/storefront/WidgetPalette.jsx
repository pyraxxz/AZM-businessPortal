// src/components/storefront/WidgetPalette.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui';
import { Lock, Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetPalette({ widgets, eligibility, onAdd, isLocked }) {
  const categories = ['HEADER', 'CONTENT', 'COMMERCE', 'SOCIAL', 'MEDIA'];

  if (!widgets?.length) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--az-text)' }}>Widgets</h2>
        </div>
        <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>No widgets available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--az-text)' }}>Widgets</h2>
      </div>

      {categories.map(cat => {
        const catWidgets = widgets.filter(w => w.category === cat);
        if (!catWidgets.length) return null;
        return (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--az-text-muted)' }}>
              {cat}
            </p>
            <div className="space-y-1.5">
              {catWidgets.map(widget => {
                const locked = isLocked ? isLocked(widget.widgetType) : false;
                return (
                  <button
                    key={widget.id || widget.widgetType}
                    disabled={locked}
                    onClick={() => onAdd(widget.widgetType, widget.defaultProps || {})}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left',
                      'border',
                      locked && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      background: 'var(--az-surface)',
                      borderColor: 'var(--az-border)',
                    }}
                    onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = 'var(--az-border-strong)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--az-border)'; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--az-accent-subtle)' }}>
                      {locked
                        ? <Lock className="w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
                        : <Plus className="w-4 h-4" style={{ color: 'var(--az-accent)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--az-text)' }}>
                        {widget.displayName || widget.widgetType}
                      </p>
                      {widget.minAzmStake > 0 && (
                        <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>
                          {locked ? `Stake ${widget.minAzmStake} AZM` : 'Premium'}
                        </p>
                      )}
                    </div>
                    {widget.minAzmStake > 0 && (
                      <Badge variant={locked ? 'danger' : 'primary'}>
                        {(widget.tier || '').replace('NITRO_', '') || 'PRO'}
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
