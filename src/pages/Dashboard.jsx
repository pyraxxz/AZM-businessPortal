import { useQuery } from '@tanstack/react-query';
import { orders as ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { StatCard, Card, Badge, Empty, Skeleton } from '@/components/ui';
import { fmtUSDC, fmt, relativeTime, ORDER_STATUS_META, KYB_STATUS_META } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Package, FileCheck,
} from 'lucide-react';

export default function Dashboard() {
  const { bizProfile } = useAuth();

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

  const stats  = statsData?.stats  || {};
  const recent = recentData?.orders || [];

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];
  const needsKyb = bizProfile?.kybStatus !== 'VERIFIED';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const bizName = bizProfile?.businessName || 'there';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8f0]">{greeting}, {bizName} 👋</h1>
          <p className="text-sm text-[#7b7b9a] mt-1">Here's what's happening with your business today.</p>
        </div>
        <Link
          to="/orders"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#00d97e] bg-[#00d97e1a] border border-[#00d97e30] hover:bg-[#00d97e25] transition-colors"
        >
          View all orders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KYB banner */}
      {needsKyb && (
        <Link to="/kyb">
          <div
            className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: kybMeta.bg, borderColor: `${kybMeta.color}40` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${kybMeta.color}20` }}
            >
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={statsLoading ? '...' : fmt(stats.totalOrders || 0, 0)}
          icon={ShoppingBag}
          color="#4f8ef7"
          loading={statsLoading}
        />
        <StatCard
          label="Revenue"
          value={statsLoading ? '...' : fmtUSDC(stats.totalRevenue || 0)}
          sub="Completed orders"
          icon={TrendingUp}
          color="#00d97e"
          loading={statsLoading}
        />
        <StatCard
          label="Pending"
          value={statsLoading ? '...' : fmt(stats.pendingOrders || 0, 0)}
          sub="Awaiting action"
          icon={Clock}
          color="#f59e0b"
          loading={statsLoading}
        />
        <StatCard
          label="Completed"
          value={statsLoading ? '...' : fmt(stats.completedOrders || 0, 0)}
          sub="All time"
          icon={CheckCircle2}
          color="#00d97e"
          loading={statsLoading}
        />
      </div>

      {/* Recent orders + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#e8e8f0]">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-[#00d97e] hover:underline">See all</Link>
          </div>

          <Card className="p-0 overflow-hidden">
            {recentLoading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : recent.length === 0 ? (
              <Empty
                icon={ShoppingBag}
                title="No orders yet"
                description="When customers place orders with your business, they'll appear here."
              />
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {recent.map(order => {
                  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.AWAITING_PAYMENT;
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#0f0f17] transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {order.orderRef?.slice(-4) || '#'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#e8e8f0] truncate">{order.title}</p>
                        <p className="text-xs text-[#4a4a6a] mt-0.5">
                          {order.customer?.username || 'Customer'} · {relativeTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#e8e8f0] az-mono">{fmtUSDC(order.amountUsdc)}</p>
                        <Badge color={meta.color} bg={meta.bg} className="mt-1">{meta.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#e8e8f0]">Quick Actions</h2>
          {[
            { icon: Package,   label: 'Add a Product',     sub: 'List something new',           to: '/products', color: '#4f8ef7' },
            { icon: ShoppingBag, label: 'View Orders',     sub: 'Track incoming deals',         to: '/orders',   color: '#00d97e' },
            { icon: FileCheck, label: 'Business Verification', sub: `Status: ${kybMeta.label}`, to: '/kyb',      color: kybMeta.color },
          ].map(({ icon: Icon, label, sub, to, color }) => (
            <Link key={to} to={to}>
              <Card hover className="flex items-center gap-4 !p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e8e8f0]">{label}</p>
                  <p className="text-xs text-[#4a4a6a]">{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#4a4a6a] flex-shrink-0" />
              </Card>
            </Link>
          ))}

          {/* Disputed orders warning */}
          {stats.disputedOrders > 0 && (
            <Link to="/orders?status=DISPUTED">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#f43f5e40] bg-[#f43f5e1a] hover:bg-[#f43f5e25] transition-colors">
                <AlertTriangle className="w-5 h-5 text-[#f43f5e] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#f43f5e]">{stats.disputedOrders} Disputed Order{stats.disputedOrders > 1 ? 's' : ''}</p>
                  <p className="text-xs text-[#7b7b9a]">Requires your attention</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
