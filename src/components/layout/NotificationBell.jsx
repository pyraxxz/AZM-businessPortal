import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingBag, Wallet, AlertTriangle, CheckCircle2, XCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { notifications as notifApi } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

// Poll cadence for the owner-facing feed. The backend persists every event, so
// polling is the source of truth; the live socket 'biz_notification' nudge (if
// present) only triggers an early refresh.
const POLL_MS = 30_000;

// Visual treatment per BizNotifType.
const TYPE_META = {
  NEW_ORDER:          { icon: ShoppingBag,  color: '#00d97e' },
  ORDER_FUNDED:       { icon: Wallet,       color: '#4f8ef7' },
  ORDER_SATISFIED:    { icon: CheckCircle2, color: '#00d97e' },
  ORDER_DISPUTED:     { icon: AlertTriangle,color: '#f59e0b' },
  ORDER_SETTLED:      { icon: CheckCircle2, color: '#00d97e' },
  ORDER_REFUNDED:     { icon: RotateCcw,    color: '#a78bfa' },
  ORDER_CANCELLED:    { icon: XCircle,      color: '#f43f5e' },
  KYB_STATUS_CHANGED: { icon: ShieldCheck,  color: '#4f8ef7' },
};

const ORDER_TYPES = new Set([
  'NEW_ORDER', 'ORDER_FUNDED', 'ORDER_SATISFIED', 'ORDER_DISPUTED',
  'ORDER_SETTLED', 'ORDER_REFUNDED', 'ORDER_CANCELLED',
]);

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  // Lightweight: badge count only. Runs on the poll interval.
  const refreshCount = useCallback(async () => {
    try {
      const { count } = await notifApi.unreadCount();
      setUnread(count || 0);
    } catch {
      /* transient — keep last known count */
    }
  }, []);

  // Heavy: full feed page. Runs when the dropdown opens.
  const refreshFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notifApi.list({ limit: 20 });
      setItems(data.notifications || []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the badge count; also listen for the optional socket nudge.
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);

    const sock = window.__azSocket; // set by the app if a socket is wired; optional
    const onNudge = () => { refreshCount(); if (open) refreshFeed(); };
    if (sock?.on) sock.on('biz_notification', onNudge);

    return () => {
      clearInterval(id);
      if (sock?.off) sock.off('biz_notification', onNudge);
    };
  }, [refreshCount, refreshFeed, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) refreshFeed();
  };

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      notifApi.markRead(n.id).catch(() => refreshFeed());
    }
    setOpen(false);
    if (ORDER_TYPES.has(n.type)) navigate('/orders');
    else if (n.type === 'KYB_STATUS_CHANGED') navigate('/kyb');
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await notifApi.markAllRead();
    } catch {
      refreshFeed();
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl hover:bg-[#13131e] transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-[#4a4a6a]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f43f5e] text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] flex flex-col rounded-2xl border border-[#2a2a3e] shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--az-surface)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e] flex-shrink-0">
            <span className="text-sm font-semibold text-[#e8e8f0]">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-[#4f8ef7] hover:text-[#6ba3f8] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-[#4a4a6a]">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-6 h-6 text-[#2a2a3e] mx-auto mb-2" />
                <p className="text-xs text-[#4a4a6a]">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || { icon: Bell, color: '#4a4a6a' };
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[#13131e] hover:bg-[#13131e] transition-colors',
                      !n.isRead && 'bg-[#00d97e08]'
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}30` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#e8e8f0] truncate">{n.title}</p>
                      <p className="text-xs text-[#7b7b9a] mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-[#4a4a6a] mt-1">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00d97e] flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
