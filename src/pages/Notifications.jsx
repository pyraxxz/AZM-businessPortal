import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notifications as notifApi } from '@/lib/api';
import { Card, Button, Badge, Skeleton, Empty, GlassPanel } from '@/components/ui';
import { useBizNotifications } from '@/hooks/useBizNotifications';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  Bell, CheckCheck, ShoppingBag, Wallet, AlertTriangle,
  CheckCircle2, ShieldCheck, Clock, ArrowRight
} from 'lucide-react';

const TABS = [
  { key: 'ALL', label: 'All Operations' },
  { key: 'UNREAD', label: 'Unread Alerts' },
  { key: 'NEW_ORDER', label: 'Orders' },
  { key: 'SYSTEM', label: 'System' },
  { key: 'ALERT', label: 'Disputes & Alerts' }
];

const TYPE_META = {
  NEW_ORDER: { icon: ShoppingBag, color: '#6C4FD1', label: 'Order Event' },
  ORDER_FUNDED: { icon: Wallet, color: '#3B82F6', label: 'Payment Clear' },
  ORDER_SATISFIED: { icon: CheckCircle2, color: '#10B981', label: 'Settlement Complete' },
  ORDER_DISPUTED: { icon: AlertTriangle, color: '#EF4444', label: 'Merchant Dispute' },
  INVENTORY_LOW: { icon: AlertTriangle, color: '#F59E0B', label: 'Inventory Restock' },
  KYB_STATUS_CHANGED: { icon: ShieldCheck, color: '#3B82F6', label: 'Governance KYB' },
  SHIFT_ALERT: { icon: Clock, color: '#6C4FD1', label: 'Workforce Shift' },
};

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('ALL');

  // Activate Real-time notifications connection
  useBizNotifications();

  // Fetch lists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['biz-notifications'],
    queryFn: async () => {
      return notifApi.list({});
    }
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['biz-notifications-unread-count'],
    queryFn: () => notifApi.unreadCount()
  });

  const notificationsList = data?.notifications || data || [];
  const unreadCount = unreadCountData?.count ?? data?.unreadCount ?? 0;

  // Mutations
  const markOne = useMutation({
    mutationFn: (id) => notifApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biz-notifications'] });
      qc.invalidateQueries({ queryKey: ['biz-notifications-unread-count'] });
      toast.show('Marked as read', 'success');
    }
  });

  const markAll = useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biz-notifications'] });
      qc.invalidateQueries({ queryKey: ['biz-notifications-unread-count'] });
      toast.show('All notifications cleared', 'success');
    }
  });

  // Filters based on tabs selection
  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((n) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'UNREAD') return !n.isRead;
      if (activeTab === 'NEW_ORDER') return n.type === 'NEW_ORDER' || n.type === 'ORDER_FUNDED';
      if (activeTab === 'SYSTEM') return n.type === 'KYB_STATUS_CHANGED' || n.type === 'SHIFT_ALERT';
      if (activeTab === 'ALERT') return n.type === 'ORDER_DISPUTED' || n.type === 'INVENTORY_LOW';
      return true;
    });
  }, [notificationsList, activeTab]);

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markOne.mutate(n.id);
    }
    const m = n.metadata || {};
    if (m.orderId) {
      navigate(`/orders/${m.orderId}`);
    } else if (m.reservationId) {
      navigate('/reservations');
    } else if (m.employeeId) {
      navigate('/employees');
    } else if (n.type === 'KYB_STATUS_CHANGED') {
      navigate('/kyb');
    }
  };

  const formatRelativeTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    const date = new Date(timeStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--az-border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--az-text)]">Notification Center</h1>
            {unreadCount > 0 && (
              <Badge color="#6C4FD1" bg="rgba(108, 79, 209, 0.1)">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--sn-text-muted)] mt-1">
            Real-time feed of business transactions, gateway updates, and operator logs.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="gap-1.5 h-9"
          >
            <CheckCheck className="w-4 h-4 text-[#6C4FD1]" /> Mark All Read
          </Button>
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--az-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === tab.key
                ? 'bg-[#6C4FD1]/15 text-[#6C4FD1] border-[#6C4FD1]'
                : 'bg-white text-[var(--sn-text-muted)] border-[var(--az-border)] hover:bg-[var(--az-border)]/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification feed cards list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="flex items-center justify-center py-16 border-dashed border-[var(--az-border)]">
          <Empty
            icon={Bell}
            title="All quiet here"
            description="No active notifications found matching this category tab."
          />
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((n) => {
            const meta = TYPE_META[n.type] || { icon: Bell, color: '#6C4FD1', label: 'System Notice' };
            const Icon = meta.icon;
            return (
              <GlassPanel
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  'p-4 border rounded-2xl flex gap-4 hover:shadow-md transition-all duration-300 cursor-pointer relative items-start',
                  n.isRead ? 'border-[var(--az-border)] opacity-85' : 'border-[#6C4FD1]/50 bg-[#6C4FD1]/5 shadow-sm'
                )}
              >
                {/* Left borders indicator for unread states */}
                {!n.isRead && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#6C4FD1] rounded-l-2xl" />
                )}

                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-[var(--sn-text-muted)] font-mono">
                      {formatRelativeTime(n.createdAt || n.created_date)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--az-text)] mt-1">{n.title}</h4>
                  <p className="text-xs text-[var(--sn-text-muted)] mt-1 leading-relaxed">
                    {n.message || n.content}
                  </p>
                </div>

                <div className="flex-shrink-0 self-center text-[var(--sn-text-muted)] hover:text-[#6C4FD1] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* Notifications settings shortcut helper card */}
      <GlassPanel className="p-5 border border-[var(--az-border)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
        <div>
          <h3 className="text-xs font-bold text-[var(--az-text)]">Prefer Slack or SMS channels?</h3>
          <p className="text-[10px] text-[var(--sn-text-muted)] mt-1">
            Configure custom alerting pipelines in the main Settings Hub anytime.
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = '/settings'; }}
          size="sm"
          className="bg-[#6C4FD1] text-white hover:bg-[#5b42b1] text-xs h-9"
        >
          Notification Settings
        </Button>
      </GlassPanel>

    </div>
  );
}
