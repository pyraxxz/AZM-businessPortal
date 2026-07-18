// src/components/storefront/ThemePicker.jsx
import { Badge } from '@/components/ui';
import { Lock, Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemePicker({ themes, currentThemeId, eligibility, onThemeChange }) {
  if (!themes?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--az-text)' }}>Theme</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {themes.map(theme => {
          const locked = theme.minAzmStake > (eligibility?.stakedBalance ?? 0);
          const isActive = theme.id === currentThemeId;
          const tokens = theme.tokenSet || {};
          const accent = tokens.accent || 'var(--az-accent)';
          const bg = tokens.background || 'var(--az-bg)';
          return (
            <button key={theme.id} disabled={locked} onClick={() => onThemeChange(theme.id)}
              className={cn('relative rounded-xl border-2 p-3 transition-all text-left', locked && 'opacity-50 cursor-not-allowed')}
              style={{
                background: bg,
                borderColor: isActive ? 'var(--az-accent)' : 'var(--az-border)',
                boxShadow: isActive ? '0 0 0 3px var(--az-accent-subtle)' : 'none',
              }}>
              <div className="flex gap-1 mb-2">
                <div className="w-5 h-5 rounded-md" style={{ background: accent }} />
                <div className="w-5 h-5 rounded-md border" style={{ background: tokens.surface || 'var(--az-surface)', borderColor: 'var(--az-border)' }} />
                <div className="w-5 h-5 rounded-md border" style={{ background: tokens.textPrimary || 'var(--az-text)', borderColor: 'var(--az-border)' }} />
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--az-text)' }}>{theme.name}</p>
              {locked
                ? <div className="absolute top-2 right-2"><Lock className="w-3 h-3" style={{ color: 'var(--az-text-muted)' }} /></div>
                : isActive
                  ? <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--az-accent)' }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  : null
              }
              {theme.minAzmStake > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--az-text-muted)' }}>
                  {locked ? `Stake ${theme.minAzmStake} AZM` : (theme.tier || '').replace('NITRO_', '')}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
