/**
 * Dashboard — Sentry-inspired widget-based dashboard.
 * Business-type-aware: shows different widgets for transit, restaurant, hotel, retail, etc.
 *
 * Sentry design tenets applied:
 * - Widget-based layout (like Sentry's dashboard widgets)
 * - Placeholders instead of loading spinners
 * - Data-dense, clean visual hierarchy
 * - Global date range context
 * - Type-specific widget sections
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orders as ordersApi, invoices as invoicesApi } from '@/lib/api';
import { reservations as resApi, transit as transitApi, checkIn as checkInApi, reviews as reviewsApi } from '@/lib/marketplaceApi';
import { useAuth } from '@/lib/AuthContext';
import { Widget, WidgetStat, WidgetRow } from '@/components/ui/Widget';
import { Badge, Skeleton, Card } from '@/components/ui';
import { fmtUSDC, fmt, relativeTime, ORDER_STATUS_META, KYB_STATUS_META, cn } from '@/lib/utils';
import { getTypeConfig } from '@/lib/businessTypes';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Package, FileCheck,
  Receipt, DollarSign, Bus, Users, CalendarCheck,
  QrCode, Star, UserCheck, UserX, Route, Sparkles,
  UtensilsCrossed, Building2, Briefcase, Store,
} from 'lucide-react';

// ── Revenue computation ──────────────────────────────────────────────────────
function computeDailyRevenue(orders, days = 30) {
  const map = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    map[key] = { date: key, label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), revenue: 0 };
  }
  orders
    .filter(o => o.status === 'COMPLETED')
    .forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (map[key]) map[key].revenue += Number(o.amountUsdc) || 0;
    });
  return Object.values(map);
}

function computeFunnel(orders) {
  const funded    = ['PAID', 'DELIVERED', 'COMPLETED', 'DISPUTED'];
  const delivered = ['DELIVERED', 'COMPLETED'];
  return [
    { label: 'Total',     count: orders.length,                                          color: '#4f8ef7' },
    { label: 'Paid',      count: orders.filter(o => funded.includes(o.status)).length,    color: '#a78bfa' },
    { label: 'Delivered', count: orders.filter(o => delivered.includes(o.status)).length, color: '#00b8d9' },
    { label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length,      color: '#00d97e' },
  ];
}

const TYPE_ICONS = { Bus, UtensilsCrossed, Building2, Briefcase, Store, ShoppingBag };

export default function Dashboard() {
  const { bizProfile } = useAuth();
  const typeConfig = getTypeConfig(bizProfile);
  const TypeIcon = TYPE_ICONS[typeConfig.icon] || Store;

  // ── Core queries (shared across all business types) ──────────────────────
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['biz-stats'],
    queryFn:  () => ordersApi.stats(),
    refetchInterval: 60_000,
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn:  () => ordersApi.list({ limit: 5 }),
    refetchInterval: 30_000,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics-orders'],
    queryFn:  () => ordersApi.list({ limit: 50 }),
    refetchInterval: 60_000,
  });

  const { data: invoiceData } = useQuery({
    queryKey: ['dashboard-invoices'],
    queryFn:  () => invoicesApi.list({ limit: 50 }),
    refetchInterval: 60_000,
  });

  // ── Type-specific queries ────────────────────────────────────────────────
  const { data: resStatsData } = useQuery({
    queryKey: ['reservation-stats'],
    queryFn:  () => resApi.stats(),
    enabled: typeConfig.navItems.includes('reservations'),
  });

  const { data: transitData } = useQuery({
    queryKey: ['transit-trips-dashboard'],
    queryFn:  () => transitApi.list(),
    enabled: typeConfig.type === 'TRANSIT',
  });

  const { data: checkInStatsData } = useQuery({
    queryKey: ['checkin-stats-dashboard'],
    queryFn:  () => checkInApi.todayStats(),
    enabled: typeConfig.navItems.includes('checkin'),
  });

  const { data: reviewStatsData } = useQuery({
    queryKey: ['review-stats-dashboard'],
    queryFn:  () => reviewsApi.stats(),
    enabled: true,
  });

  // ── Computed values ──────────────────────────────────────────────────────
  const stats  = statsData?.stats  || {};
  const recent = recentData?.orders || [];
  const analyticsOrders = analyticsData?.orders || [];
  const allInvoices = invoiceData?.invoices || [];

  const dailyRevenue = useMemo(() => computeDailyRevenue(analyticsOrders, 30), [analyticsOrders]);
  const funnel       = useMemo(() => computeFunnel(analyticsOrders), [analyticsOrders]);
  const hasRevenue   = dailyRevenue.some(d => d.revenue > 0);
  const funnelMax    = Math.max(funnel[0]?.count || 0, 1);

  const invoiceStats = useMemo(() => ({
    sent: allInvoices.filter(i => i.status === 'SENT').length,
    paid: allInvoices.filter(i => i.status === 'PAID').length,
    paidRevenue: allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (Number(i.billTotalUsdc) || 0), 0),
  }), [allInvoices]);

  const resStats = resStatsData?.stats || {};
  const checkInStats = checkInStatsData?.stats || {};
  const reviewStats = reviewStatsData?.stats || {};
  const trips = transitData?.trips || [];

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];
  const needsKyb = bizProfile?.kybStatus !== 'VERIFIED';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const bizName = bizProfile?.businessName || 'there';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ── Header with business type badge ──────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8f0] flex items-center gap-2">
            {greeting}, {bizName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-sm text-[#7b7b9a]">Here's what's happening today.</p>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: `${typeConfig.color}1a`, color: typeConfig.color, border: `1px solid ${typeConfig.color}30` }}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              {typeConfig.label}
            </span>
          </div>
        </div>
        <Link
          to="/orders"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#00d97e] bg-[#00d97e1a] border border-[#00d97e30] hover:bg-[#00d97e25] transition-colors"
        >
          View all orders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── KYB banner ────────────────────────────────────────────────────── */}
      {needsKyb && (
        <Link to="/kyb">
          <div
            className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: kybMeta.bg, borderColor: `${kybMeta.color}40` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${kybMeta.color}20` }}>
              <FileCheck className="w-5 h-5" style={{ color: kybMeta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: kybMeta.color }}>
                {bizProfile?.kybStatus === 'UNVERIFIED' && 'Complete your business verification'}
                {bizProfile?.kybStatus === 'PENDING' && 'Verification is under review'}
                {bizProfile?.kybStatus === 'REJECTED' && 'Verification rejected — please resubmit'}
              </p>
              <p className="text-xs text-[#7b7b9a] mt-0.5">
                {bizProfile?.kybStatus === 'UNVERIFIED' && 'Upload your business documents to start receiving orders publicly.'}
                {bizProfile?.kybStatus === 'PENDING' && "We're reviewing your documents. This usually takes 24–48 hours."}
                {bizProfile?.kybStatus === 'REJECTED' && 'Review the feedback and upload corrected documents.'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: kybMeta.color }} />
          </div>
        </Link>
      )}

      {/* ── Core stats widgets (all business types) ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Total Orders" icon={ShoppingBag} iconColor="#4f8ef7" loading={statsLoading}>
          <WidgetStat value={fmt(stats.totalOrders || 0, 0)} label="All time" color="#4f8ef7" />
        </Widget>
        <Widget title="Revenue" icon={TrendingUp} iconColor="#00d97e" loading={statsLoading}>
          <WidgetStat value={fmtUSDC(stats.totalRevenue || 0)} label="Completed orders" color="#00d97e" />
        </Widget>
        <Widget title="Pending" icon={Clock} iconColor="#f59e0b" loading={statsLoading}>
          <WidgetStat value={fmt(stats.pendingOrders || 0, 0)} label="Awaiting action" color="#f59e0b" />
        </Widget>
        <Widget title="Completed" icon={CheckCircle2} iconColor="#00d97e" loading={statsLoading}>
          <WidgetStat value={fmt(stats.completedOrders || 0, 0)} label="All time" color="#00d97e" />
        </Widget>
      </div>

      {/* ── Business-type-specific widgets ────────────────────────────────── */}
      {typeConfig.type === 'TRANSIT' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget title="Active Trips" icon={Bus} iconColor="#4f8ef7">
            <WidgetStat
              value={fmt(trips.filter(t => ['SCHEDULED','BOARDING'].includes(t.status)).length, 0)}
              label="Scheduled + boarding"
              color="#4f8ef7"
            />
          </Widget>
          <Widget title="Seats Sold" icon={Users} iconColor="#a78bfa">
            <WidgetStat
              value={fmt(trips.reduce((s, t) => s + (t.bookedSeats || 0), 0), 0)}
              label="All trips"
              color="#a78bfa"
            />
          </Widget>
          <Widget title="Check-Ins Today" icon={QrCode} iconColor="#00d97e">
            <WidgetStat value={fmt(checkInStats.todayCount || 0, 0)} label="Passengers" color="#00d97e" />
          </Widget>
          <Widget title="Transit Revenue" icon={DollarSign} iconColor="#00d97e">
            <WidgetStat
              value={fmtUSDC(trips.reduce((s, t) => s + (t.bookedSeats || 0) * (Number(t.fareUsdc) || 0), 0))}
              label="From seat bookings"
              color="#00d97e"
            />
          </Widget>
        </div>
      )}

      {['RESTAURANT', 'HOTEL', 'SERVICES'].includes(typeConfig.type) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget title="Reservations" icon={CalendarCheck} iconColor="#a78bfa">
            <WidgetStat value={fmt(resStats.total || 0, 0)} label="All bookings" color="#a78bfa" />
          </Widget>
          <Widget title="Pending" icon={Clock} iconColor="#f59e0b">
            <WidgetStat value={fmt(resStats.pending || 0, 0)} label="Awaiting confirmation" color="#f59e0b" />
          </Widget>
          <Widget title="Checked In" icon={UserCheck} iconColor="#00d97e">
            <WidgetStat value={fmt(checkInStats.todayCount || 0, 0)} label="Today" color="#00d97e" />
          </Widget>
          <Widget title="No-Shows" icon={UserX} iconColor="#f43f5e">
            <WidgetStat value={fmt(resStats.noShows || 0, 0)} label="Penalties applied" color="#f43f5e" />
          </Widget>
        </div>
      )}

      {/* ── Invoice KPIs (all types) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Widget title="Invoices Sent" icon={Receipt} iconColor="#4f8ef7">
          <WidgetStat value={fmt(invoiceStats.sent, 0)} label="Awaiting payment" color="#4f8ef7" />
        </Widget>
        <Widget title="Invoices Paid" icon={CheckCircle2} iconColor="#00d97e">
          <WidgetStat value={fmt(invoiceStats.paid, 0)} label="Settled" color="#00d97e" />
        </Widget>
        <Widget title="Invoice Revenue" icon={DollarSign} iconColor="#a78bfa">
          <WidgetStat value={fmtUSDC(invoiceStats.paidRevenue)} label="From paid invoices" color="#a78bfa" />
        </Widget>
      </div>

      {/* ── Revenue trend + Order funnel ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend — Area chart (Sentry-style) */}
        <div className="lg:col-span-2">
          <Widget title="Revenue Trend" subtitle="Completed orders · last 30 days" icon={TrendingUp} iconColor="#00d97e" loading={analyticsLoading}>
            {!hasRevenue ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#00d97e1a] border border-[#00d97e30] flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-[#00d97e]" />
                </div>
                <p className="text-sm text-[#7b7b9a]">Complete your first order to see revenue.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d97e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00d97e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#4a4a6a', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: '#4a4a6a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(0)}`} />
                  <Tooltip
                    cursor={{ stroke: '#2a2a3e', strokeDasharray: '4 4' }}
                    contentStyle={{ background: '#13131e', border: '1px solid #2a2a3e', borderRadius: 12 }}
                    labelStyle={{ color: '#e8e8f0', fontSize: 12 }}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00d97e" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Widget>
        </div>

        {/* Order funnel */}
        <Widget title="Order Funnel" subtitle="Lifecycle progression" icon={Package} iconColor="#4f8ef7" loading={analyticsLoading}>
          <div className="space-y-3 pt-2">
            {funnel.map(stage => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#7b7b9a]">{stage.label}</span>
                  <span className="text-xs font-bold text-[#e8e8f0] az-mono">{stage.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#1e1e2e] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(stage.count / funnelMax) * 100}%`, background: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* ── Transit-specific: upcoming trips widget ────────────────────────── */}
      {typeConfig.type === 'TRANSIT' && trips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Widget title="Upcoming Trips" subtitle="Next departures" icon={Route} iconColor="#4f8ef7">
            <div className="space-y-0 max-h-[240px] overflow-y-auto">
              {trips
                .filter(t => ['SCHEDULED', 'BOARDING'].includes(t.status))
                .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
                .slice(0, 5)
                .map(trip => {
                  const booked = trip.bookedSeats || 0;
                  const total = trip.totalSeats || 0;
                  const pct = total > 0 ? (booked / total) * 100 : 0;
                  return (
                    <WidgetRow
                      key={trip.id}
                      label={trip.routeName}
                      value={`${booked}/${total}`}
                      badge={<Badge color={pct > 80 ? '#f59e0b' : '#00d97e'}>{pct > 80 ? 'Filling Up' : 'Available'}</Badge>}
                      onClick={() => window.location.href = '/transit'}
                    />
                  );
                })}
            </div>
          </Widget>

          {/* Recent check-ins for transit */}
          <Widget title="Recent Check-Ins" subtitle="Passenger activity" icon={QrCode} iconColor="#00d97e">
            <div className="space-y-0">
              <WidgetRow label="Checked in today" value={fmt(checkInStats.todayCount || 0, 0)} badge={<Badge color="#00d97e">Today</Badge>} />
              <WidgetRow label="Pending" value={fmt(checkInStats.pending || 0, 0)} badge={<Badge color="#f59e0b">Waiting</Badge>} />
              <WidgetRow label="No-shows" value={fmt(checkInStats.noShows || 0, 0)} badge={<Badge color="#f43f5e">Today</Badge>} />
              <WidgetRow label="Total guests" value={fmt(checkInStats.totalGuests || 0, 0)} badge={<Badge color="#4f8ef7">All time</Badge>} />
            </div>
          </Widget>
        </div>
      )}

      {/* ── Reservation-specific widgets ──────────────────────────────────── */}
      {['RESTAURANT', 'HOTEL', 'SERVICES'].includes(typeConfig.type) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Widget title="Reservation Summary" subtitle="By status" icon={CalendarCheck} iconColor="#a78bfa">
            <div className="space-y-0">
              <WidgetRow label="Pending" value={fmt(resStats.pending || 0, 0)} badge={<Badge color="#f59e0b">Action needed</Badge>} />
              <WidgetRow label="Confirmed" value={fmt(resStats.confirmed || 0, 0)} badge={<Badge color="#4f8ef7">Upcoming</Badge>} />
              <WidgetRow label="Checked In" value={fmt(resStats.checkedIn || 0, 0)} badge={<Badge color="#00d97e">Today</Badge>} />
              <WidgetRow label="No-Shows" value={fmt(resStats.noShows || 0, 0)} badge={<Badge color="#f43f5e">Penalized</Badge>} />
            </div>
          </Widget>

          <Widget title="Check-In Activity" subtitle="Today" icon={QrCode} iconColor="#00d97e">
            <div className="space-y-0">
              <WidgetRow label="Checked in" value={fmt(checkInStats.todayCount || 0, 0)} badge={<Badge color="#00d97e">Today</Badge>} />
              <WidgetRow label="Pending" value={fmt(checkInStats.pending || 0, 0)} badge={<Badge color="#f59e0b">Waiting</Badge>} />
              <WidgetRow label="No-shows" value={fmt(checkInStats.noShows || 0, 0)} badge={<Badge color="#f43f5e">Today</Badge>} />
              <WidgetRow label="Total guests" value={fmt(checkInStats.totalGuests || 0, 0)} badge={<Badge color="#4f8ef7">All time</Badge>} />
            </div>
          </Widget>
        </div>
      )}

      {/* ── Reviews widget (all types) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget title="Customer Rating" icon={Star} iconColor="#f59e0b">
          <div className="flex items-center gap-3">
            <WidgetStat value={fmt(reviewStats.avgRating || 0, 1)} color="#f59e0b" />
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('w-4 h-4', s <= Math.round(reviewStats.avgRating || 0) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#2a2a3e]')} />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[#4a4a6a] mt-2">{reviewStats.total || 0} reviews</p>
        </Widget>

        <Widget title="Stories Promoted" icon={Sparkles} iconColor="#a78bfa">
          <WidgetStat value={fmt(reviewStats.storiesPromoted || 0, 0)} label="From reviews" color="#a78bfa" />
        </Widget>

        {/* Recent orders widget */}
        <Widget title="Recent Orders" subtitle="Latest activity" icon={ShoppingBag} iconColor="#4f8ef7" loading={recentLoading}>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center">
              <p className="text-xs text-[#7b7b9a]">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-0 max-h-[160px] overflow-y-auto">
              {recent.map(o => {
                const meta = ORDER_STATUS_META[o.status] || {};
                return (
                  <WidgetRow
                    key={o.id}
                    label={o.azamanId || o.reference || `#${o.id.slice(-6)}`}
                    value={o.amountUsdc ? fmtUSDC(o.amountUsdc) : '—'}
                    badge={<Badge color={meta.color}>{meta.label}</Badge>}
                  />
                );
              })}
            </div>
          )}
        </Widget>
      </div>
    </div>
  );
}
