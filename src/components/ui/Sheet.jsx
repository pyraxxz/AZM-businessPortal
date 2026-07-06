import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Sheet({ open, onClose, title, children, side = 'right', width = 'max-w-md', className }) {
  if (!open) return null;
  const sideClass = side === 'right' ? 'right-0' : 'left-0';
  const animation = side === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute top-0 bottom-0 overflow-y-auto border-l border-[var(--sn-border)] shadow-2xl',
          sideClass, animation, width, className
        )}
        style={{ background: 'var(--sn-card)' }}
      >
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[var(--sn-border)] z-10" style={{ background: 'var(--sn-card)' }}>
          <h2 className="text-base font-bold text-[var(--sn-text)]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--sn-card-hover)] text-[var(--sn-text-muted)] hover:text-[var(--sn-text)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
