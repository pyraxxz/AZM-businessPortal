import { cn } from '@/lib/utils';

const SIZES = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-2xl' };

export function Avatar({ src, name = '', size = 'md', ring = false, online = false, className }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['var(--az-success)', 'var(--az-info)', 'var(--az-warning)', 'var(--az-accent)', 'var(--az-danger)', 'var(--az-info)'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIdx];

  return (
    <div className={cn('relative rounded-full flex-shrink-0', SIZES[size], className)}>
      <div
        className={cn('w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold', ring && 'ring-2 ring-[var(--az-accent)] ring-offset-2 ring-offset-[var(--az-bg)]')}
        style={src ? undefined : { background: `${bgColor}25`, color: bgColor }}
      >
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--az-accent)] rounded-full border-2 border-[var(--az-bg)]" />
      )}
    </div>
  );
}
