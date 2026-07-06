import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function DatePicker({ value, onChange, label, placeholder = 'Select date', className }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedDate = value ? new Date(value) : null;
  const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <div className={cn('relative', className)}>
      {label && <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-xl bg-[var(--sn-surface)] border border-[var(--sn-border)] text-[var(--sn-text)] text-sm flex items-center gap-2 hover:border-[var(--sn-purple-border)] transition-colors"
      >
        <Calendar className="w-4 h-4 text-[var(--sn-text-muted)]" />
        {value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 p-4 rounded-xl border border-[var(--sn-border)] shadow-2xl" style={{ background: 'var(--sn-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-[var(--sn-card-hover)] text-[var(--sn-text-muted)]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--sn-text)]">{months[month]} {year}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-[var(--sn-card-hover)] text-[var(--sn-text-muted)]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => <span key={d} className="text-[10px] text-center text-[var(--sn-text-muted)] font-medium">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(year, month, i + 1);
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, selectedDate);
              return (
                <button
                  key={i}
                  onClick={() => { onChange(date.toISOString()); setOpen(false); }}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-[var(--sn-purple)] text-[var(--sn-black)]'
                      : isToday
                        ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)] border border-[var(--sn-purple-border)]'
                        : 'text-[var(--sn-text-secondary)] hover:bg-[var(--sn-card-hover)]'
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
