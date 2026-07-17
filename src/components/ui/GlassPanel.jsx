import { cn } from '@/lib/utils';

export function GlassPanel({ children, className, as: Component = 'div', solid = false, hover = false, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-az-lg border transition-all duration-200',
        solid
          ? 'bg-az-surface-solid border-az-border shadow-az-card'
          : 'bg-az-surface backdrop-blur-glass border-az-border shadow-az-card',
        hover && 'hover:shadow-az-card-hover hover:border-az-border-strong',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
