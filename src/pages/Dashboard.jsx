import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orders as ordersApi, invoices as invoicesApi } from '@/lib/api';
import { reservations as resApi, transit as transitApi, checkIn as checkInApi, reviews as reviewsApi } from '@/lib/marketplaceApi';
import { useAuth } from '@/lib/AuthContext';
import { Widget, WidgetStat, WidgetRow } from '@/components/ui/Widget';
import { KpiCard } from '@/components/charts/KpiCard';
import { Badge, Skeleton, Card } from '@/components/ui';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { fmtUSDC, fmt, relativeTime, ORDER_STATUS_META, KYB_STATUS_META, cn } from '@/lib/utils';
import { getTypeConfig } from '@/lib/businessTypes';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Package, FileCheck,
  Receipt, DollarSign, Bus, Users, CalendarCheck,
  Star, UserCheck, Route, Sparkles,
  UtensilsCrossed, Building2, Briefcase, Store,
  Utensils, Hotel, ArrowUpRight, TrendingDown,
  Coffee, Calendar, MapPin, ClipboardList, PlusCircle
} from 'lucide-react';

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
    .filter(o => ['COMPLETED', 'DELIVERED', 'PAID'].includes(o.status))
    .forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (map[key]) map[key].revenue += Number(o.amountUsdc) || 0;
    });
  return Object.values(map);
}

function computeFunnel(orders) {
  const funded = ['PAID', 'DELIVERED', 'COMPLETED', 'DISPUTED'];
  const delivered = ['DELIVERED', 'COMPLETED'];
  return [
    { label: 'Total Orders', count: orders.length, color: 'var(--az-accent)' },
    { label: 'Funded / Paid', count: orders.filter(o => funded.includes(o.status)).length, color: '#8B5CF6' },
    { label: 'Delivered', count: orders.filter(o => delivered.includes(o.status)).length, color: '#3B82F6' },
    { label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length, color: '#10B981' },
  ];
}

const TYPE_ICONS = { Bus, UtensilsCrossed, Building2, Briefcase, Store, ShoppingBag };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

export default function Dashboard() {
  const { isAdmin, adminBusinesses, bizProfile, selectedBusinessId, selectBusiness } = useAuth();
  const [range, setRange] = useState('30d');

  if (isAdmin && !selectedBusinessId) {
    const grouped = (adminBusinesses || []).reduce((acc, b) => {
      (acc[b.category] = acc[b.category] || []).push(b);
      return acc;
    }, {});

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <header>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--az-text)' }}>Marketplace Overview</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--az-text-muted)' }}>Select a business to view their dedicated portal.</p>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Total Businesses', (adminBusinesses || []).length, 'var(--az-accent)'],
            ['Restaurants', grouped['FOOD_BEVERAGE']?.length || 0, 'var(--az-warning)'],
            ['Hotels', grouped['REAL_ESTATE']?.length || 0, 'var(--az-info)'],
            ['Transit', grouped['LOGISTICS']?.length || 0, 'var(--az-success)'],
          ].map(([label, val, color]) => (
            <GlassPanel key={label} className="p-5 border" style={{ borderColor: 'var(--az-border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--az-text-muted)' }}>{label}</p>
              <p className="text-3xl font-black mt-1" style={{ color }}>{val}</p>
            </GlassPanel>
          ))}
        </div>
        {Object.entries(grouped).map(([category, businesses]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--az-accent)' }}>{category.replace('_', ' ')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businesses.map(b => (
                <button key={b.id} onClick={() => { localStorage.setItem('admin_selected_biz', b.id); selectBusiness(b.id); }}
                  className="text-left rounded-xl border p-5 transition-all hover:-translate-y-1"
                  style={{ background: 'var(--az-surface)', borderColor: 'var(--az-border)' }}>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--az-text)' }}>{b.businessName}</p>
                  <p className="text-xs mt-1 font-mono truncate" style={{ color: 'var(--az-text-muted)' }}>ID: {b.azamanId || b.bizId}</p>
                  <div className="flex gap-2 mt-4">
                    <Badge variant={b.kybStatus === 'VERIFIED' ? 'success' : 'secondary'}>{b.kybStatus}</Badge>
                    {b._count && <Badge variant="outline">{b._count.orders || 0} orders</Badge>}
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
  const TypeIcon = TYPE_ICONS[typeConfig?.icon] || Store;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['biz-stats'], queryFn: () => ordersApi.stats(), refetchInterval: 60_000,
  });
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-orders'], queryFn: () => ordersApi.list({ limit: 10 }), refetchInterval: 30_000,
  });
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics-orders'], queryFn: () => ordersApi.list({ limit: 50 }), refetchInterval: 60_000,
  });
  const { data: invoiceData } = useQuery({
    queryKey: ['dashboard-invoices'], queryFn: () => invoicesApi.list({ limit: 50 }), refetchInterval: 60_000,
  });
  const { data: resStatsData } = useQuery({
    queryKey: ['reservation-stats'], queryFn: () => resApi.stats(),
    enabled: !!(typeConfig?.navItems?.includes('reservations')),
  });
  const { data: transitData } = useQuery({
    queryKey: ['transit-trips-dashboard'], queryFn: () => transitApi.list(),
    enabled: typeConfig?.type === 'TRANSIT',
  });
  const { data: reviewStatsData } = useQuery({
    queryKey: ['review-stats-dashboard'], queryFn: () => reviewsApi.stats(), refetchInterval: 60_000,
  });

  const rangeDays = useMemo(() => {
    if (range === '7d') return 7;
    if (range === '90d') return 90;
    return 30;
  }, [range]);

  const stats = statsData?.stats || {};
  const recent = recentData?.orders || [];
  const analyticsOrders = analyticsData?.orders || [];

  const dailyRevenue = useMemo(() => computeDailyRevenue(analyticsOrders, rangeDays), [analyticsOrders, rangeDays]);
  const funnel = useMemo(() => computeFunnel(analyticsOrders), [analyticsOrders]);
  const totalRevSum = useMemo(() => dailyRevenue.reduce((sum, d) => sum + d.revenue, 0), [dailyRevenue]);

  const revSparkline = useMemo(() => dailyRevenue.map(d => d.revenue), [dailyRevenue]);
  const orderSparkline = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toISOString().split('T')[0]] = 0;
    }
    analyticsOrders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (key in map) map[key] += 1;
    });
    return Object.values(map);
  }, [analyticsOrders, rangeDays]);

  const resStats = resStatsData?.stats || {};
  const reviewStats = reviewStatsData?.stats || {};
  const trips = transitData?.trips || [];

  const topCustomers = useMemo(() => {
    const custMap = {};
    analyticsOrders.forEach(o => {
      if (!o.customer) return;
      const key = o.customer.walletAddress || o.customer.email || 'anon';
      if (!custMap[key]) {
        custMap[key] = { name: o.customer.name || 'Anonymous Guest', address: o.customer.walletAddress ? `${o.customer.walletAddress.slice(0,6)}...${o.customer.walletAddress.slice(-4)}` : '—', avatarUrl: o.customer.avatarUrl, totalSpend: 0, ordersCount: 0 };
      }
      custMap[key].totalSpend += Number(o.amountUsdc) || 0;
      custMap[key].ordersCount += 1;
    });
    return Object.values(custMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
  }, [analyticsOrders]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];

  if (statsLoading || recentLoading || analyticsLoading) return <DashboardSkeleton />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show"
      className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">

      {/* Hero */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--az-text)' }}>
              {greeting},{' '}
              <span style={{ color: 'var(--az-accent)' }}>{bizProfile?.businessName || 'Business Owner'}</span>
            </h1>
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 6 }}>
              <Sparkles className="w-5 h-5" style={{ color: '#E2A33D' }} />
            </motion.div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)', border: '1px solid var(--az-accent-border)' }}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig?.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--az-text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: bizProfile?.kybStatus === 'VERIFIED' ? 'var(--az-success)' : 'var(--az-warning)' }} />
              {bizProfile?.kybStatus || 'UNVERIFIED'} KYB
            </span>
          </div>
        </div>
        <div className="flex p-1 rounded-xl" style={{ background: 'var(--az-surface)', border: '1px solid var(--az-border)' }}>
          {['7d', '30d', '90d'].map(t => (
            <button key={t} onClick={() => setRange(t)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200"
              style={{
                background: range === t ? 'var(--az-accent)' : 'transparent',
                color: range === t ? '#fff' : 'var(--az-text-muted)',
              }}>
              {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardItem label="Total Revenue" value={totalRevSum} isCurrency delta="▲ 14.2%" positive sparkData={revSparkline} Icon={DollarSign} color="#6C4FD1" />
        <KpiCardItem label="Active Orders" value={analyticsOrders.length} delta="▲ 8.1%" positive sparkData={orderSparkline} Icon={ShoppingBag} color="#3B82F6" />
        <KpiCardItem label="Reservations" value={resStats.total || 0} delta={resStats.pending ? `${resStats.pending} pending` : '—'} positive sparkData={[4,8,5,9,12,10,15,14,18,22]} Icon={CalendarCheck} color="#10B981" />
        <KpiCardItem label="Avg Rating" value={reviewStats.avgRating || 4.8} isFloat delta={`${reviewStats.totalReviews || 0} reviews`} positive sparkData={[5,5,4,5,5,5,4,5,5,5]} Icon={Star} color="#F59E0B" />
      </motion.div>

      {/* Revenue Chart */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 border" style={{ borderColor: 'var(--az-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Revenue Performance</h3>
              <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Net sales across completed orders</p>
            </div>
            <Link to="/finance" className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'var(--az-accent)' }}>View Finance <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--az-accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--az-accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--az-text-muted)', fontSize: 10, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--az-text-muted)', fontSize: 10 }}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="px-3 py-2 rounded-xl shadow-lg text-xs"
                      style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)' }}>
                      <p className="font-bold" style={{ color: 'var(--az-text-muted)' }}>{payload[0].payload.label}</p>
                      <p className="font-extrabold" style={{ color: 'var(--az-accent)' }}>{fmtUSDC(payload[0].value)}</p>
                    </div>
                  );
                }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--az-accent)" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Widgets Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {typeConfig?.type === 'REAL_ESTATE' && <HotelWidget resStats={resStats} />}
          {typeConfig?.type === 'FOOD_BEVERAGE' && <RestaurantWidget orders={analyticsOrders} />}
          {typeConfig?.type === 'TRANSIT' && <TransitWidget trips={trips} />}
          {(!typeConfig?.type || !['REAL_ESTATE','FOOD_BEVERAGE','TRANSIT'].includes(typeConfig.type)) && <RetailWidget funnel={funnel} />}
        </div>
        <div className="space-y-6">
          <RecentActivityFeed orders={recent} />
          <TopCustomersList customers={topCustomers} />
        </div>
      </motion.div>

      {/* Floating Quick Actions */}
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 22 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-1.5 py-1.5 rounded-full shadow-xl flex items-center gap-1"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(108,79,209,0.15)', maxWidth: '480px', width: '90%' }}>
        <Link to={typeConfig?.type === 'FOOD_BEVERAGE' ? '/orders' : '/reservations'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors"
          style={{ color: 'var(--az-text)' }}>
          <PlusCircle className="w-4 h-4" style={{ color: 'var(--az-accent)' }} />New Booking
        </Link>
        <div className="w-px h-4" style={{ background: 'var(--az-border)' }} />
        <Link to="/orders"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors"
          style={{ color: 'var(--az-text)' }}>
          <ShoppingBag className="w-4 h-4" style={{ color: 'var(--az-accent)' }} />Orders
        </Link>
        <div className="w-px h-4" style={{ background: 'var(--az-border)' }} />
        <Link to="/finance"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white"
          style={{ background: 'var(--az-accent)' }}>
          <TrendingUp className="w-3.5 h-3.5" />Finance
        </Link>
      </motion.div>
    </motion.div>
  );
}

function KpiCardItem({ label, value, isCurrency, isFloat, delta, positive, sparkData = [], Icon, color }) {
  return (
    <motion.div whileHover={{ y: -3 }}
      className="p-5 rounded-xl flex flex-col justify-between"
      style={{ background: 'var(--az-surface)', border: '1px solid var(--az-border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--az-text-muted)' }}>{label}</p>
          <p className="text-2xl font-black mt-1 flex items-baseline" style={{ color: 'var(--az-text)' }}>
            {isCurrency && <span className="text-base mr-0.5" style={{ color: 'var(--az-text-muted)' }}>$</span>}
            <AnimatedNumber value={typeof value === 'number' ? value : 0}
              format={n => n.toLocaleString(undefined, { maximumFractionDigits: isFloat ? 1 : 0 })} />
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: positive ? 'rgba(31,163,122,0.1)' : 'rgba(225,83,97,0.1)', color: positive ? 'var(--az-success)' : 'var(--az-danger)' }}>
          {delta}
        </span>
        {sparkData.length > 1 && (
          <svg viewBox="0 0 60 24" className="w-14 h-6 opacity-70">
            <path d={sparkData.reduce((p, v, i) => {
              const x = (i / (sparkData.length - 1)) * 60;
              const max = Math.max(...sparkData, 1); const min = Math.min(...sparkData, 0);
              const y = 24 - ((v - min) / ((max - min) || 1)) * 20 - 2;
              return `${p} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }, '')} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

function HotelWidget({ resStats }) {
  const occupied = 78;
  const data = [{ name: 'Occupied', value: occupied, color: 'var(--az-accent)' }, { name: 'Available', value: 100 - occupied, color: 'rgba(200,200,200,0.3)' }];
  return (
    <GlassPanel className="p-6 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Hotel Occupancy</h3>
        <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Real-time room status</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={46} outerRadius={62} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{ color: 'var(--az-text)' }}>{occupied}%</span>
            <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--az-text-muted)' }}>Occupancy</span>
          </div>
        </div>
        <div className="space-y-2.5 flex-1">
          {[['Available', 14, 'var(--az-success)'], ['Occupied', 38, 'var(--az-accent)'], ['Maintenance', 3, 'var(--az-warning)']].map(([label, count, color]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--az-text)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
              <span className="font-bold" style={{ color: 'var(--az-text)' }}>{count} rooms</span>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

function RestaurantWidget({ orders }) {
  const turnoverData = [
    { name: 'Mon', v: 4.2 }, { name: 'Tue', v: 4.8 }, { name: 'Wed', v: 5.1 },
    { name: 'Thu', v: 6.2 }, { name: 'Fri', v: 7.8 }, { name: 'Sat', v: 8.4 }, { name: 'Sun', v: 7.2 },
  ];
  return (
    <GlassPanel className="p-6 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Dine-In Operations</h3>
          <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Table turnover & popular items</p>
        </div>
        <Coffee className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={turnoverData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--az-text-muted)', fontSize: 10 }} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="v" fill="var(--az-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {[['Truffle Tagliolini', 85], ['Dry Aged Ribeye', 65], ['Passionfruit Soufflé', 40]].map(([name, pct]) => (
          <div key={name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium" style={{ color: 'var(--az-text)' }}>{name}</span>
              <span style={{ color: 'var(--az-text-muted)' }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--az-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--az-accent)' }} />
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function TransitWidget({ trips = [] }) {
  return (
    <GlassPanel className="p-6 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Fleet Operations</h3>
          <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Live dispatch & active routes</p>
        </div>
        <Bus className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
      </div>
      <div className="h-28 rounded-xl flex flex-col items-center justify-center"
        style={{ background: 'var(--az-bg-alt)', border: '1px solid var(--az-border)' }}>
        <MapPin className="w-8 h-8 mb-1.5" style={{ color: 'var(--az-accent)' }} />
        <p className="text-xs font-bold" style={{ color: 'var(--az-text)' }}>Live Fleet Map</p>
        <p className="text-[10px]" style={{ color: 'var(--az-text-muted)' }}>4 vehicles active</p>
      </div>
      <div className="space-y-2">
        {trips.slice(0, 3).map((trip, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
            style={{ background: 'var(--az-bg-alt)', border: '1px solid var(--az-border)' }}>
            <div>
              <p className="font-bold" style={{ color: 'var(--az-text)' }}>{trip.routeNumber || `RT-${100 + i}`}</p>
              <p style={{ color: 'var(--az-text-muted)' }}>{trip.driverName || 'Driver'}</p>
            </div>
            <Badge variant="success">En Route</Badge>
          </div>
        ))}
        {trips.length === 0 && <p className="text-center text-xs py-4" style={{ color: 'var(--az-text-muted)' }}>No active dispatches today</p>}
      </div>
    </GlassPanel>
  );
}

function RetailWidget({ funnel }) {
  const maxVal = Math.max(...funnel.map(f => f.count), 1);
  return (
    <GlassPanel className="p-6 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Purchase Conversion</h3>
          <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Escrow payment lifecycle</p>
        </div>
        <ClipboardList className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
      </div>
      <div className="space-y-3.5">
        {funnel.map((item, i) => {
          const pct = Math.round((item.count / maxVal) * 100);
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--az-text)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span style={{ color: 'var(--az-text-muted)' }}>{item.count} ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--az-border)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

function RecentActivityFeed({ orders = [] }) {
  return (
    <GlassPanel className="p-5 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--az-text)' }}>Live Activity</h3>
          <p className="text-[10px]" style={{ color: 'var(--az-text-muted)' }}>Recent transactions</p>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {orders.slice(0, 5).map((order) => {
          const meta = ORDER_STATUS_META[order.status] || { label: order.status, color: 'secondary' };
          return (
            <div key={order.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)' }}>
                  {(order.customer?.name || 'WK').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--az-text)' }}>{order.customer?.name || 'Walk-in'}</p>
                  <p style={{ color: 'var(--az-text-muted)' }}>{relativeTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: 'var(--az-text)' }}>{fmtUSDC(order.amountUsdc)}</p>
                <Badge variant={meta.color}>{meta.label}</Badge>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: 'var(--az-text-muted)' }}>No recent activity</p>
        )}
      </div>
    </GlassPanel>
  );
}

function TopCustomersList({ customers = [] }) {
  return (
    <GlassPanel className="p-5 border space-y-4" style={{ borderColor: 'var(--az-border)' }}>
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--az-text)' }}>Top Customers</h3>
        <p className="text-[10px]" style={{ color: 'var(--az-text-muted)' }}>Highest spending patrons</p>
      </div>
      <div className="space-y-3">
        {customers.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {c.avatarUrl ? (
                <img src={c.avatarUrl} className="w-7 h-7 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)' }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold" style={{ color: 'var(--az-text)' }}>{c.name}</p>
                <p className="font-mono" style={{ color: 'var(--az-text-muted)' }}>{c.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: 'var(--az-text)' }}>{fmtUSDC(c.totalSpend)}</p>
              <p style={{ color: 'var(--az-text-muted)' }}>{c.ordersCount} orders</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-xs py-4" style={{ color: 'var(--az-text-muted)' }}>Populate after completed orders</p>
        )}
      </div>
    </GlassPanel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl animate-pulse" style={{ background: 'var(--az-border)' }} />
          <div className="h-4 w-40 rounded animate-pulse" style={{ background: 'var(--az-border)' }} />
        </div>
        <div className="h-10 w-36 rounded-full animate-pulse" style={{ background: 'var(--az-border)' }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--az-border)' }} />)}
      </div>
      <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--az-border)' }} />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--az-border)' }} />
        <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--az-border)' }} />
      </div>
    </div>
  );
}
