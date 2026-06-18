import { useState, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notifications as notifApi } from '@/lib/api';
import { useBizNotifications } from '@/hooks/useBizNotifications';
import { Card, Button, Empty, Skeleton } from '@/components/ui';
import { cn, relativeTime } from '@/lib/utils';
import {
  Bell, CheckCheck, ShoppingBag, Wallet, AlertTriangle,
  CheckCircle2, XCircle, RotateCcw, ShieldCheck,
} from 'lucide-react';

// Visual treatment per BizNotifType (mirrors NotificationBell).
const TYPE_META = {
  NEW_ORDER:          { icon: ShoppingBag,   color: '#00d97e' },
  ORDER_FUNDED:       { icon: Wallet,        color: '#4f8ef7' },
  ORDER_SATISFIED:    { icon: CheckCircle2,  color: '#00d97e' },
  ORDER_DISPUTED:     { icon: AlertTriangle, color: '#f59e0b' },
  ORDER_SETTLED:      { icon: CheckCircle2,  color: '#00d97e' },
  ORDER_REFUNDED:     { icon: RotateCcw,     color: '#a78bfa' },
  ORDER_CANCELLED:    { icon: XCircle,       color: '#f43f5e' },
  KYB_STATUS_CHANGED: { icon: ShieldCheck,   color: '#4f8ef7' },
};

const ORDER_TYPES = new Set([
  'NEW_ORDER', 'ORDER_FUNDED', 'ORDER_SATISFIED', 'ORDER_DISPUTED',
  'ORDER_SETTLED', 'ORDER_REFUNDED', 'ORDER_CANCELLED',
]);

const FILTERS = [
  { key: 'ALL',    label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'ORDERS', label: 'Orders' },
  { key: 'KYB',    label: 'KYB' },
];

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  // Live: socket events invalidate the ['biz-notifications'] queries below.
  useBizNotifications();

  const {
    data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['biz-notifications', filter === 'UNREAD' ? 'unread' : 'all'],
    queryFn: ({ pageParam }) =>
      notifApi.list({
        limit: 20,
        ...(pageParam ? { cursor: pageParam } : {}),
        ...(filter === 'UNREAD' ? { unreadOnly: true } : {}),
      }),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  const all = useMemo(
    () => (data?.pages || []).flatMap((p) => p.notifications || []),
    [data],
  );
  const unreadCount = data?.pages?.[0]?.unreadCount ?? 0;

  // Orders / KYB tabs filter the loaded feed client-side (the API filters only
  // by read-state). All / Unread are served directly.
  const items = useMemo(() => {
    if (filter === 'ORDERS') return all.filter((n) => ORDER_TYPES.has(n.type));
    if (filter === 'KYB')    return all.filter((n) => n.type === 'KYB_STATUS_CHANGED');
    return all;
  }, [all, filter]);

  const markAll = useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biz-notifications'] });
      qc.invalidateQueries({ queryKey: ['biz-notifications-count'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id) => notifApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biz-notifications'] });
      qc.invalidateQueries({ queryKey: ['biz-notifications-count'] });
    },
  });

  const handleClick = (n) => {
    if (!n.isRead) markOne.mutate(n.id);
    const orderId = n.metadata?.orderId;
    if (ORDER_TYPES.has(n.type)) navigate(orderId ? `/orders/${orderId}` : '/orders');
    else if (n.type === 'KYB_STATUS_CHANGED') navigate('/kyb');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8f0]">Notifications</h1>
          <p className="text-sm text-[#7b7b9a] mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'You’re all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={active
                ? { background: '#00d97e1a', color: '#00d97e', border: '1px solid #00d97e40' }
                : { background: '#13131e', color: '#4a4a6a', border: '1px solid #1e1e2e' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : items.length === 0 ? (
          <Empty
            icon={Bell}
            title="No notifications"
            description={filter === 'ALL'
              ? 'When orders come in or your verification changes, you’ll see it here.'
              : 'Nothing matches this filter yet.'}
          />
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || { icon: Bell, color: '#4a4a6a' };
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[#0f0f17] transition-colors',
                    !n.isRead && 'bg-[#00d97e08]',
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#e8e8f0]">{n.title}</p>
                    <p className="text-xs text-[#7b7b9a] mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-[#4a4a6a] mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00d97e] flex-shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Load more — only meaningful for the server-driven tabs */}
      {hasNextPage && (filter === 'ALL' || filter === 'UNREAD') && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
