import { GlassPanel } from '@/components/ui/GlassPanel';
import { Smartphone } from 'lucide-react';

export default function StorefrontPhonePreview({ draft, theme, widgets }) {
  const tokens = theme?.tokenSet || {};
  const accent = tokens.accent || 'var(--az-accent)';
  const bg = tokens.background || 'var(--az-bg)';
  const surface = tokens.surface || 'var(--az-surface)';
  const textPrimary = tokens.textPrimary || 'var(--az-text)';

  return (
    <GlassPanel solid className="p-3 animate-phone-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3 h-3 text-az-text-muted" />
          <span className="text-xs font-semibold text-az-text-muted">Live Preview</span>
        </div>
      </div>
      <div
        className="rounded-[28px] border-4 overflow-hidden shadow-2xl"
        style={{ borderColor: 'var(--az-surface-solid)', width: 240, background: bg }}
      >
        <div style={{ minHeight: 400 }}>
          {draft?.layoutJson?.tiles?.map(tile => (
            <div key={tile.id} className="p-3" style={{ background: surface, color: textPrimary }}>
              <p className="text-xs font-semibold" style={{ color: textPrimary }}>
                {tile.widgetType.replace(/_/g, ' ')}
              </p>
              {tile.props?.subtitle && (
                <p className="text-xs mt-1" style={{ color: tokens.textSecondary || 'var(--az-text-secondary)' }}>
                  {tile.props.subtitle}
                </p>
              )}
            </div>
          )) || (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-az-text-muted">No tiles yet</p>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
