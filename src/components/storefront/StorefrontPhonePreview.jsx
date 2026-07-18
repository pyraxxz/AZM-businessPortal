// src/components/storefront/StorefrontPhonePreview.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Smartphone } from 'lucide-react';

export default function StorefrontPhonePreview({ draft, theme, widgets }) {
  const tokens = theme?.tokenSet || {};
  const accent = tokens.accent || 'var(--az-accent)';
  const bg = tokens.background || 'var(--az-bg)';
  const surface = tokens.surface || 'var(--az-surface)';
  const textPrimary = tokens.textPrimary || 'var(--az-text)';
  const tiles = draft?.layoutJson?.tiles || [];

  return (
    <GlassPanel solid className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3 h-3" style={{ color: 'var(--az-text-muted)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--az-text-muted)' }}>Live Preview</span>
        </div>
        {theme && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)' }}>
            {theme.name}
          </span>
        )}
      </div>

      {/* Phone frame */}
      <div className="rounded-[28px] border-4 overflow-hidden shadow-2xl mx-auto"
        style={{ borderColor: 'var(--az-surface-solid)', width: 240, background: bg }}>
        {/* Status bar */}
        <div className="flex justify-between items-center px-4 py-1.5 text-[10px]"
          style={{ background: accent, color: '#fff' }}>
          <span className="font-semibold">9:41</span>
          <div className="flex gap-1">
            <span>●●●</span>
            <span>WiFi</span>
            <span>100%</span>
          </div>
        </div>

        {/* Business header */}
        <div className="px-3 py-3 text-center" style={{ background: surface }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-1.5 flex items-center justify-center"
            style={{ background: accent }}>
            <span className="text-lg font-black text-white">B</span>
          </div>
          <p className="text-xs font-bold" style={{ color: textPrimary }}>Your Business</p>
          <p className="text-[10px] mt-0.5" style={{ color: tokens.textSecondary || 'var(--az-text-secondary)' }}>
            Tap to follow
          </p>
        </div>

        {/* Tiles */}
        <div style={{ minHeight: 300 }}>
          {tiles.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[10px]" style={{ color: tokens.textSecondary || 'var(--az-text-secondary)' }}>
                No tiles yet
              </p>
            </div>
          ) : (
            tiles.map(tile => (
              <div key={tile.id} className="p-3 border-b"
                style={{ background: surface, borderColor: tokens.border || 'var(--az-border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: accent }}>
                  {(tile.widgetType || '').replace(/_/g, ' ')}
                </p>
                {tile.props?.title && (
                  <p className="text-xs font-semibold" style={{ color: textPrimary }}>{tile.props.title}</p>
                )}
                {tile.props?.subtitle && (
                  <p className="text-[10px] mt-0.5" style={{ color: tokens.textSecondary || 'var(--az-text-secondary)' }}>
                    {tile.props.subtitle}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
