// src/components/storefront/NitroUpsellBanner.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Zap, TrendingUp } from 'lucide-react';

export default function NitroUpsellBanner({ eligibility }) {
  if (!eligibility) return null;
  const staked = eligibility.stakedBalance ?? 0;
  const nextTier = staked < 500   ? { name: 'Bronze', needed: 500  - staked }
                 : staked < 1500  ? { name: 'Silver', needed: 1500 - staked }
                 : staked < 5000  ? { name: 'Gold',   needed: 5000 - staked }
                 : null;
  if (!nextTier) return null;
  return (
    <GlassPanel className="p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--az-accent-subtle)' }}>
          <Zap className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold" style={{ color: 'var(--az-text)' }}>Unlock Nitro {nextTier.name}</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--az-text-muted)' }}>
            Stake {nextTier.needed} more AZM to unlock premium themes and widgets.
          </p>
          <button className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'var(--az-accent)', color: '#fff' }}>
            <TrendingUp className="w-3.5 h-3.5" />Stake AZM
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
