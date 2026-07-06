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
      <div className="flex gap-1 p-1 rounded-xl border border-[var(--sn-border)] bg-[var(--sn-surface)]">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleTabChange(i)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
              active === i
                ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)] border border-[var(--sn-purple-border)]'
                : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text-secondary)] hover:bg-[var(--sn-card-hover)]'
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4 inline mr-1.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                active === i ? 'bg-[var(--sn-purple)] text-[var(--sn-black)]' : 'bg-[var(--sn-border)] text-[var(--sn-text-muted)]'
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
