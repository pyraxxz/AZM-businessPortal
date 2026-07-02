// Lightweight UI primitives — no Radix dependency for simple cases
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = '#00d97e', bg, className }) {
  const bgColor = bg || `${color}1a`;
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{ color, background: bgColor }}
    >
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary:   'bg-[#00d97e] text-[#0a0a0f] hover:bg-[#00c870] active:scale-[0.98] az-glow-emerald',
    secondary: 'bg-[#13131e] border border-[#2a2a3e] text-[#e8e8f0] hover:bg-[#1e1e2e] hover:border-[#3a3a5a]',
    ghost:     'text-[#7b7b9a] hover:bg-[#13131e] hover:text-[#e8e8f0]',
    danger:    'bg-[#f43f5e1a] border border-[#f43f5e40] text-[#f43f5e] hover:bg-[#f43f5e25]',
    outline:   'border border-[#2a2a3e] text-[#7b7b9a] hover:border-[#00d97e40] hover:text-[#00d97e]',
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
        'rounded-2xl border border-[#1e1e2e] p-5',
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
      {label && <label className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e] text-[#e8e8f0] text-sm',
          'placeholder:text-[#4a4a6a] outline-none',
          'focus:border-[#00d97e60] focus:ring-1 focus:ring-[#00d97e20] transition-colors',
          error && 'border-[#f43f5e60]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#f43f5e]">{error}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wider">{label}</label>}
      <textarea
        rows={3}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e] text-[#e8e8f0] text-sm resize-none',
          'placeholder:text-[#4a4a6a] outline-none',
          'focus:border-[#00d97e60] focus:ring-1 focus:ring-[#00d97e20] transition-colors',
          error && 'border-[#f43f5e60]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#f43f5e]">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e] text-[#e8e8f0] text-sm',
          'outline-none focus:border-[#00d97e60] transition-colors cursor-pointer',
          error && 'border-[#f43f5e60]',
          className
        )}
        {...props}
      >
        {options.map(({ value, label: lbl }) => (
          <option key={value} value={value} style={{ background: '#13131e' }}>
            {lbl}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#f43f5e]">{error}</p>}
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
    <div className={cn('border-2 border-[#2a2a3e] border-t-[#00d97e] rounded-full animate-spin', sz[size])} />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#13131e] border border-[#2a2a3e] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#4a4a6a]" />
        </div>
      )}
      <p className="text-[#e8e8f0] font-semibold text-base mb-1">{title}</p>
      {description && <p className="text-[#7b7b9a] text-sm max-w-xs">{description}</p>}
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
          'relative w-full max-w-lg rounded-2xl border border-[#2a2a3e] shadow-2xl animate-scale-in',
          className
        )}
        style={{ background: 'var(--az-card)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
            <h2 className="text-base font-bold text-[#e8e8f0]">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#e8e8f0] transition-colors">
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
export function StatCard({ label, value, sub, icon: Icon, color = '#00d97e', loading }) {
  if (loading) return <Skeleton className="h-28" />;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-[#e8e8f0] az-mono">{value}</p>
          {sub && <p className="text-xs text-[#7b7b9a] mt-1">{sub}</p>}
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
