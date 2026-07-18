// Lightweight UI primitives — no Radix dependency for simple cases
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export { GlassPanel } from './GlassPanel';
export { AnimatedNumber } from './AnimatedNumber';

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color, bg, variant, className }) {
  const variantColors = {
    primary: { color: 'var(--az-accent)', bg: 'var(--az-accent-subtle)' },
    success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    danger:  { color: 'var(--az-danger)', bg: 'var(--az-danger-subtle)' },
    warning: { color: 'var(--az-warning)', bg: 'var(--az-warning-subtle)' },
    muted:   { color: 'var(--az-text-muted)', bg: 'var(--az-bg-alt)' },
  };
  const resolved = variant ? variantColors[variant] || variantColors.primary : null;
  const finalColor = color || resolved?.color || 'var(--sn-purple)';
  const finalBg    = bg    || resolved?.bg    || `${finalColor}1a`;
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{ color: finalColor, background: finalBg }}
    >
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary:   'bg-[var(--sn-purple)] text-[var(--az-black)] hover:bg-[#00c870] active:scale-[0.98] az-glow-emerald',
    secondary: 'bg-[var(--sn-card)] border border-[var(--sn-border)] text-[var(--sn-text)] hover:bg-[var(--sn-border)] hover:border-[#3a3a5a]',
    ghost:     'text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] hover:text-[var(--sn-text)]',
    danger:    'bg-[var(--sn-red)] border border-[var(--sn-red)] text-[var(--sn-red)] hover:bg-[var(--sn-red)]',
    outline:   'border border-[var(--sn-border)] text-[var(--sn-text-muted)] hover:border-[var(--sn-purple)] hover:text-[var(--sn-purple)]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  };
  return (
    <button
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--sn-border)] p-5',
        hover && 'az-card-hover cursor-pointer',
        className
      )}
      style={{ background: 'var(--az-card)' }}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)] text-[var(--sn-text)] text-sm',
          'placeholder:text-[var(--sn-text-muted)] outline-none',
          'focus:border-[var(--sn-purple)] focus:ring-1 focus:ring-[var(--sn-purple)] transition-colors',
          error && 'border-[var(--sn-red)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--sn-red)]">{error}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">{label}</label>}
      <textarea
        rows={3}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)] text-[var(--sn-text)] text-sm resize-none',
          'placeholder:text-[var(--sn-text-muted)] outline-none',
          'focus:border-[var(--sn-purple)] focus:ring-1 focus:ring-[var(--sn-purple)] transition-colors',
          error && 'border-[var(--sn-red)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--sn-red)]">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)] text-[var(--sn-text)] text-sm',
          'outline-none focus:border-[var(--sn-purple)] transition-colors cursor-pointer',
          error && 'border-[var(--sn-red)]',
          className
        )}
        {...props}
      >
        {options.map(({ value, label: lbl }) => (
          <option key={value} value={value} style={{ background: 'var(--sn-card)' }}>
            {lbl}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--sn-red)]">{error}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('az-shimmer rounded-xl', className)} />;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={cn('border-2 border-[var(--sn-border)] border-t-[var(--sn-purple)] rounded-full animate-spin', sz[size])} />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--sn-card)] border border-[var(--sn-border)] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[var(--sn-text-muted)]" />
        </div>
      )}
      <p className="text-[var(--sn-text)] font-semibold text-base mb-1">{title}</p>
      {description && <p className="text-[var(--sn-text-muted)] text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-[var(--sn-border)] shadow-2xl animate-scale-in',
          className
        )}
        style={{ background: 'var(--az-card)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sn-border)]">
            <h2 className="text-base font-bold text-[var(--sn-text)]">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-text)] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'var(--sn-purple)', loading }) {
  if (loading) return <Skeleton className="h-28" />;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-[var(--sn-text)] az-mono">{value}</p>
          {sub && <p className="text-xs text-[var(--sn-text-muted)] mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}1a`, border: `1px solid ${color}30` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>
    </Card>
  );
}

export * from './Widget';
export * from './DataTable';
export * from './GlobalFilter';
export * from './Tabs';
export * from './Progress';
export * from './Avatar';
export * from './Tooltip';
export * from './Switch';
export * from './Sheet';
export * from './DatePicker';
export * from './Toast';
export * from './Command';
export * from './Separator';
export * from './DropdownMenu';
