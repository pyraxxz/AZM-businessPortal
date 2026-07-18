import { Badge } from '@/components/ui';
import { Lock, Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemePicker({ themes, currentThemeId, eligibility, onThemeChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="w-4 h-4 text-az-text-muted" />
        <h3 className="text-sm font-bold text-az-text uppercase tracking-wider">Theme</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {themes.map(theme => {
          const locked = theme.minAzmStake > (eligibility?.stakedBalance ?? 0);
          const isActive = theme.id === currentThemeId;
          const tokens = theme.tokenSet || {};
          const accent = tokens.accent || 'var(--az-accent)';
          const bg = tokens.background || 'var(--az-bg)';

          return (
            <button
              key={theme.id}
              disabled={locked}
              onClick={() => onThemeChange(theme.id)}
              className={cn(
                'relative rounded-xl border-2 p-3 transition-all text-left',
                isActive ? 'border-az-accent shadow-az-card' : 'border-az-border hover:border-az-border-strong',
                locked && 'opacity-50 cursor-not-allowed'
              )}
              style={{ background: bg }}
            >
              <div className="flex gap-1 mb-2">
                <div className="w-5 h-5 rounded-md" style={{ background: accent }} />
                <div className="w-5 h-5 rounded-md border border-az-border" style={{ background: tokens.surface || 'var(--az-surface)' }} />
                <div className="w-5 h-5 rounded-md border border-az-border" style={{ background: tokens.textPrimary || 'var(--az-text)' }} />
              </div>
              <p className="text-xs font-semibold text-az-text truncate">{theme.name}</p>
              {locked ? (
                <div className="absolute top-2 right-2"><Lock className="w-3 h-3 text-az-text-muted" /></div>
              ) : isActive ? (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 rounded-full bg-az-accent flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              ) : null}
              {theme.minAzmStake > 0 && (
                <p className="text-xs text-az-text-muted mt-1">
                  {locked ? `Stake ${theme.minAzmStake} AZM` : theme.tier?.replace('NITRO_', '') || ''}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
