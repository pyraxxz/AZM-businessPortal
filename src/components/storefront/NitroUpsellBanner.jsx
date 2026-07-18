import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui';
import { Zap, TrendingUp } from 'lucide-react';

export default function NitroUpsellBanner({ eligibility }) {
  if (!eligibility) return null;
  const staked = eligibility.stakedBalance ?? 0;
  const nextTier = staked < 500 ? { name: 'Bronze', needed: 500 - staked }
    : staked < 1500 ? { name: 'Silver', needed: 1500 - staked }
    : staked < 5000 ? { name: 'Gold', needed: 5000 - staked }
    : null;

  if (!nextTier) return null;

  return (
    <GlassPanel className="p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--az-accent-subtle)' }}>
          <Zap className="w-5 h-5 text-az-accent" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-az-text">Unlock Nitro {nextTier.name}</h4>
          <p className="text-xs text-az-text-muted mt-0.5">
            Stake {nextTier.needed} more AZM to unlock premium themes and widgets.
          </p>
          <Button variant="primary" size="sm" className="mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Stake AZM
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
