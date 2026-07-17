import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ tabs, defaultIndex = 0, onChange, className }) {
  const [active, setActive] = useState(defaultIndex);

  const handleTabChange = (i) => {
    setActive(i);
    onChange?.(i);
  };

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 rounded-xl border border-[var(--az-border)] bg-[var(--az-surface)]">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleTabChange(i)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
              active === i
                ? 'bg-[var(--az-accent-subtle)] text-[var(--az-accent)] border border-[var(--az-accent)]'
                : 'text-[var(--az-text-muted)] hover:text-[var(--az-text-muted)] hover:bg-[var(--az-bg-alt)]'
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4 inline mr-1.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                active === i ? 'bg-[var(--az-accent)] text-[var(--az-bg)]' : 'bg-[var(--az-border)] text-[var(--az-text-muted)]'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {tabs[active]?.content && <div className="mt-4">{tabs[active].content}</div>}
    </div>
  );
}
