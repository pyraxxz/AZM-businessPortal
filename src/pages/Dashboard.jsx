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
import { KpiCard } from '@/components/charts/KpiCard';
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
    { label: 'Total',     count: orders.length,                                          color: 'var(--sn-blue)' },
    { label: 'Paid',      count: orders.filter(o => funded.includes(o.status)).length,    color: 'var(--sn-purple)' },
    { label: 'Delivered', count: orders.filter(o => delivered.includes(o.status)).length, color: 'var(--sn-blue)' },
    { label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length,      color: 'var(--sn-purple)' },
  ];
}

const TYPE_ICONS = { Bus, UtensilsCrossed, Building2, Briefcase, Store, ShoppingBag };

export default function Dashboard() {
  const { isAdmin, adminBusinesses, bizProfile, selectedBusinessId, selectBusiness } = useAuth();

  if (isAdmin && !selectedBusinessId) {
      const grouped = adminBusinesses.reduce((acc, b) => {
          (acc[b.category] = acc[b.category] || []).push(b);
          return acc;
      }, {});

      return (
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
              <header>
                  <h1 className="text-2xl font-bold text-[var(--sn-text)]">Marketplace Overview</h1>
                  <p className="text-sm text-[var(--sn-text-muted)] mt-1">Select a business from the sidebar to manage their portal.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Widget className="p-4">
                      <p className="text-xs text-[var(--sn-text-muted)] font-semibold uppercase">Total</p>
                      <p className="text-2xl font-bold text-[var(--sn-text)] mt-1">{adminBusinesses.length}</p>
                  </Widget>
                  <Widget className="p-4">
                      <p className="text-xs text-[var(--sn-text-muted)] font-semibold uppercase">Restaurants</p>
                      <p className="text-2xl font-bold text-[var(--sn-text)] mt-1">{grouped['FOOD_BEVERAGE']?.length || 0}</p>
                  </Widget>
                  <Widget className="p-4">
                      <p className="text-xs text-[var(--sn-text-muted)] font-semibold uppercase">Hotels</p>
                      <p className="text-2xl font-bold text-[var(--sn-text)] mt-1">{grouped['REAL_ESTATE']?.length || 0}</p>
                  </Widget>
                  <Widget className="p-4">
                      <p className="text-xs text-[var(--sn-text-muted)] font-semibold uppercase">Transit</p>
                      <p className="text-2xl font-bold text-[var(--sn-text)] mt-1">{grouped['LOGISTICS']?.length || 0}</p>
                  </Widget>
              </div>

              {Object.entries(grouped).map(([category, businesses]) => (
                  <div key={category} className="space-y-3">
                      <h2 className="text-sm font-bold text-[var(--sn-text)] uppercase tracking-wider">{category}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {businesses.map(b => (
                              <button
                                  key={b.id}
                                  onClick={() => {
                                      localStorage.setItem('admin_selected_biz', b.id);
                                      selectBusiness(b.id);
                                  }}
                                  className="text-left rounded-xl border border-[var(--sn-border)] bg-[var(--sn-card)] hover:bg-[var(--sn-hover)] hover:border-[var(--sn-purple)50] p-4 transition-all"
                              >
                                  <p className="text-sm font-bold text-[var(--sn-text)] truncate">{b.businessName}</p>
                                  <p className="text-xs text-[var(--sn-text-muted)] mt-1 truncate">ID: {b.azamanId || b.bizId}</p>
                                  <div className="flex gap-2 mt-3">
                                      <Badge variant={b.kybStatus === 'VERIFIED' ? 'success' : 'secondary'}>{b.kybStatus}</Badge>
                                      {b._count && (
                                          <Badge variant="outline">{b._count.orders || 0} orders</Badge>
                                      )}
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  }

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
      {/* Employee Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Employees" value="42" delta="+2 this month" deltaType="positive" />
        <KpiCard label="Active Shifts" value="12" delta="Right now" deltaType="positive" />
        <KpiCard label="Time Off Requests" value="3" delta="Pending approval" deltaType="positive" />
        <KpiCard label="Monthly Payroll" value="24,500 USDC" delta="+5% vs last" deltaType="positive" />
      </div>

      {/* ── Header with business type badge ──────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)] flex items-center gap-2">
            {greeting}, {bizName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-sm text-[var(--sn-text-muted)]">Here's what's happening today.</p>
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--sn-purple)] bg-[var(--sn-purple)1a] border border-[var(--sn-purple)30] hover:bg-[var(--sn-purple)25] transition-colors"
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
              <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">
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
        <Widget title="Total Orders" icon={ShoppingBag} iconColor="var(--sn-blue)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.totalOrders || 0, 0)} label="All time" color="var(--sn-blue)" />
        </Widget>
        <Widget title="Revenue" icon={TrendingUp} iconColor="var(--sn-purple)" loading={statsLoading}>
          <WidgetStat value={fmtUSDC(stats.totalRevenue || 0)} label="Completed orders" color="var(--sn-purple)" />
        </Widget>
        <Widget title="Pending" icon={Clock} iconColor="var(--sn-amber)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.pendingOrders || 0, 0)} label="Awaiting action" color="var(--sn-amber)" />
        </Widget>
        <Widget title="Completed" icon={CheckCircle2} iconColor="var(--sn-purple)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.completedOrders || 0, 0)} label="All time" color="var(--sn-purple)" />
        </Widget>
      </div>

      {/* ── Business-type-specific widgets ────────────────────────────────── */}
      {typeConfig.type === 'TRANSIT' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget title="Active Trips" icon={Bus} iconColor="var(--sn-blue)">
            <WidgetStat
              value={fmt(trips.filter(t => ['SCHEDULED','BOARDING'].includes(t.status)).length, 0)}
              label="Scheduled + boarding"
              color="var(--sn-blue)"
            />
          </Widget>
          <Widget title="Seats Sold" icon={Users} iconColor="var(--sn-purple)">
            <WidgetStat
              value={fmt(trips.reduce((s, t) => s + (t.bookedSeats || 0), 0), 0)}
              label="All trips"
              color="var(--sn-purple)"
            />
          </Widget>
          <Widget title="Check-Ins Today" icon={QrCode} iconColor="var(--sn-purple)">
            <WidgetStat value={fmt(checkInStats.todayCount || 0, 0)} label="Passengers" color="var(--sn-purple)" />
          </Widget>
          <Widget title="Transit Revenue" icon={DollarSign} iconColor="var(--sn-purple)">
            <WidgetStat
              value={fmtUSDC(trips.reduce((s, t) => s + (t.bookedSeats || 0) * (Number(t.fareUsdc) || 0), 0))}
              label="From seat bookings"
              color="var(--sn-purple)"
            />
          </Widget>
        </div>
      )}

      {['RESTAURANT', 'HOTEL', 'SERVICES'].includes(typeConfig.type) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget title="Reservations" icon={CalendarCheck} iconColor="var(--sn-purple)">
            <WidgetStat value={fmt(resStats.total || 0, 0)} label="All bookings" color="var(--sn-purple)" />
          </Widget>
          <Widget title="Pending" icon={Clock} iconColor="var(--sn-amber)">
            <WidgetStat value={fmt(resStats.pending || 0, 0)} label="Awaiting confirmation" color="var(--sn-amber)" />
          </Widget>
          <Widget title="Checked In" icon={UserCheck} iconColor="var(--sn-purple)">
            <WidgetStat value={fmt(checkInStats.todayCount || 0, 0)} label="Today" color="var(--sn-purple)" />
          </Widget>
          <Widget title="No-Shows" icon={UserX} iconColor="var(--sn-red)">
            <WidgetStat value={fmt(resStats.noShows || 0, 0)} label="Penalties applied" color="var(--sn-red)" />
          </Widget>
        </div>
      )}

      {/* ── Invoice KPIs (all types) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Widget title="Invoices Sent" icon={Receipt} iconColor="var(--sn-blue)">
          <WidgetStat value={fmt(invoiceStats.sent, 0)} label="Awaiting payment" color="var(--sn-blue)" />
        </Widget>
        <Widget title="Invoices Paid" icon={CheckCircle2} iconColor="var(--sn-purple)">
          <WidgetStat value={fmt(invoiceStats.paid, 0)} label="Settled" color="var(--sn-purple)" />
        </Widget>
        <Widget title="Invoice Revenue" icon={DollarSign} iconColor="var(--sn-purple)">
          <WidgetStat value={fmtUSDC(invoiceStats.paidRevenue)} label="From paid invoices" color="var(--sn-purple)" />
        </Widget>
      </div>

      {/* ── Revenue trend + Order funnel ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend — Area chart (Sentry-style) */}
        <div className="lg:col-span-2">
          <Widget title="Revenue Trend" subtitle="Completed orders · last 30 days" icon={TrendingUp} iconColor="var(--sn-purple)" loading={analyticsLoading}>
            {!hasRevenue ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--sn-purple)1a] border border-[var(--sn-purple)30] flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-[var(--sn-purple)]" />
                </div>
                <p className="text-sm text-[var(--sn-text-muted)]">Complete your first order to see revenue.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--sn-purple)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--sn-purple)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'var(--sn-text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: 'var(--sn-text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(0)}`} />
                  <Tooltip
                    cursor={{ stroke: 'var(--sn-border)', strokeDasharray: '4 4' }}
                    contentStyle={{ background: 'var(--sn-card)', border: '1px solid var(--sn-border)', borderRadius: 12 }}
                    labelStyle={{ color: 'var(--sn-text)', fontSize: 12 }}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--sn-purple)" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Widget>
        </div>

        {/* Order funnel */}
        <Widget title="Order Funnel" subtitle="Lifecycle progression" icon={Package} iconColor="var(--sn-blue)" loading={analyticsLoading}>
          <div className="space-y-3 pt-2">
            {funnel.map(stage => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--sn-text-muted)]">{stage.label}</span>
                  <span className="text-xs font-bold text-[var(--sn-text)] az-mono">{stage.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--sn-border)] overflow-hidden">
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
          <Widget title="Upcoming Trips" subtitle="Next departures" icon={Route} iconColor="var(--sn-blue)">
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
                      badge={<Badge color={pct > 80 ? 'var(--sn-amber)' : 'var(--sn-purple)'}>{pct > 80 ? 'Filling Up' : 'Available'}</Badge>}
                      onClick={() => window.location.href = '/transit'}
                    />
                  );
                })}
            </div>
          </Widget>

          {/* Recent check-ins for transit */}
          <Widget title="Recent Check-Ins" subtitle="Passenger activity" icon={QrCode} iconColor="var(--sn-purple)">
            <div className="space-y-0">
              <WidgetRow label="Checked in today" value={fmt(checkInStats.todayCount || 0, 0)} badge={<Badge color="var(--sn-purple)">Today</Badge>} />
              <WidgetRow label="Pending" value={fmt(checkInStats.pending || 0, 0)} badge={<Badge color="var(--sn-amber)">Waiting</Badge>} />
              <WidgetRow label="No-shows" value={fmt(checkInStats.noShows || 0, 0)} badge={<Badge color="var(--sn-red)">Today</Badge>} />
              <WidgetRow label="Total guests" value={fmt(checkInStats.totalGuests || 0, 0)} badge={<Badge color="var(--sn-blue)">All time</Badge>} />
            </div>
          </Widget>
        </div>
      )}

      {/* ── Reservation-specific widgets ──────────────────────────────────── */}
      {['RESTAURANT', 'HOTEL', 'SERVICES'].includes(typeConfig.type) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Widget title="Reservation Summary" subtitle="By status" icon={CalendarCheck} iconColor="var(--sn-purple)">
            <div className="space-y-0">
              <WidgetRow label="Pending" value={fmt(resStats.pending || 0, 0)} badge={<Badge color="var(--sn-amber)">Action needed</Badge>} />
              <WidgetRow label="Confirmed" value={fmt(resStats.confirmed || 0, 0)} badge={<Badge color="var(--sn-blue)">Upcoming</Badge>} />
              <WidgetRow label="Checked In" value={fmt(resStats.checkedIn || 0, 0)} badge={<Badge color="var(--sn-purple)">Today</Badge>} />
              <WidgetRow label="No-Shows" value={fmt(resStats.noShows || 0, 0)} badge={<Badge color="var(--sn-red)">Penalized</Badge>} />
            </div>
          </Widget>

          <Widget title="Check-In Activity" subtitle="Today" icon={QrCode} iconColor="var(--sn-purple)">
            <div className="space-y-0">
              <WidgetRow label="Checked in" value={fmt(checkInStats.todayCount || 0, 0)} badge={<Badge color="var(--sn-purple)">Today</Badge>} />
              <WidgetRow label="Pending" value={fmt(checkInStats.pending || 0, 0)} badge={<Badge color="var(--sn-amber)">Waiting</Badge>} />
              <WidgetRow label="No-shows" value={fmt(checkInStats.noShows || 0, 0)} badge={<Badge color="var(--sn-red)">Today</Badge>} />
              <WidgetRow label="Total guests" value={fmt(checkInStats.totalGuests || 0, 0)} badge={<Badge color="var(--sn-blue)">All time</Badge>} />
            </div>
          </Widget>
        </div>
      )}

      {/* ── Reviews widget (all types) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget title="Customer Rating" icon={Star} iconColor="var(--sn-amber)">
          <div className="flex items-center gap-3">
            <WidgetStat value={fmt(reviewStats.avgRating || 0, 1)} color="var(--sn-amber)" />
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('w-4 h-4', s <= Math.round(reviewStats.avgRating || 0) ? 'text-[var(--sn-amber)] fill-[var(--sn-amber)]' : 'text-[var(--sn-border)]')} />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[var(--sn-text-muted)] mt-2">{reviewStats.total || 0} reviews</p>
        </Widget>

        <Widget title="Stories Promoted" icon={Sparkles} iconColor="var(--sn-purple)">
          <WidgetStat value={fmt(reviewStats.storiesPromoted || 0, 0)} label="From reviews" color="var(--sn-purple)" />
        </Widget>

        {/* Recent orders widget */}
        <Widget title="Recent Orders" subtitle="Latest activity" icon={ShoppingBag} iconColor="var(--sn-blue)" loading={recentLoading}>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center">
              <p className="text-xs text-[var(--sn-text-muted)]">No orders yet.</p>
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
