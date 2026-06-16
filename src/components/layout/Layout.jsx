import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { KYB_STATUS_META } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingBag, FileCheck,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell,
  Store, Building2, CheckCircle2, AlertCircle,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/' },
  { label: 'Orders',     icon: ShoppingBag,      to: '/orders' },
  { label: 'Products',   icon: Package,          to: '/products' },
  { label: 'Verification', icon: FileCheck,      to: '/kyb' },
  { label: 'Settings',   icon: Settings,         to: '/settings' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { bizProfile, user, logout } = useAuth();

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = (bizProfile?.businessName || user?.username || 'B').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--az-black)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col border-r border-[#1e1e2e] transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )} style={{ background: 'var(--az-surface)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1e1e2e] flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#00d97e1a] border border-[#00d97e35] flex items-center justify-center flex-shrink-0 az-glow-emerald">
            <Store className="w-4 h-4 text-[#00d97e]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#e8e8f0] leading-none tracking-tight truncate">AZAMAN</p>
              <p className="text-xs text-[#00d97e] mt-0.5 font-medium">Business Portal</p>
            </div>
          )}
        </div>

        {/* Business pill */}
        {!collapsed && bizProfile && (
          <div className="mx-3 mt-3 p-3 rounded-xl border border-[#2a2a3e]" style={{ background: '#0a0a0f' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00d97e1a] border border-[#00d97e30] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-[#00d97e]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#e8e8f0] truncate leading-tight">{bizProfile.businessName}</p>
                <p className="text-xs mt-0.5 font-medium truncate" style={{ color: kybMeta.color }}>
                  {kybMeta.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {NAV.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group text-sm',
                  active
                    ? 'bg-[#00d97e15] text-[#00d97e] font-semibold'
                    : 'text-[#4a4a6a] hover:bg-[#13131e] hover:text-[#7b7b9a]'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-[#00d97e]')} />
                {!collapsed && <span>{label}</span>}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00d97e] rounded-r-full" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#13131e] border border-[#2a2a3e] rounded-lg text-xs whitespace-nowrap text-[#e8e8f0] opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-[#1e1e2e] p-3 space-y-1">
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div className="w-7 h-7 rounded-lg bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-[#4f8ef7] font-bold">{initial}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#e8e8f0] truncate">{user.username || user.email}</p>
                <p className="text-xs text-[#4a4a6a] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#4a4a6a] hover:bg-[#f43f5e10] hover:text-[#f43f5e] transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-[#13131e] text-[#4a4a6a] hover:text-[#7b7b9a] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-16 border-b border-[#1e1e2e] flex items-center justify-between px-6 flex-shrink-0" style={{ background: 'var(--az-surface)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative w-2 h-2">
              <div className="w-2 h-2 rounded-full bg-[#00d97e]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00d97e] az-pulse" />
            </div>
            <span className="text-xs text-[#4a4a6a] font-medium">
              {bizProfile ? bizProfile.businessName : 'Connected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* KYB warning if not verified */}
            {bizProfile && bizProfile.kybStatus !== 'VERIFIED' && (
              <Link
                to="/kyb"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{ background: kybMeta.bg, color: kybMeta.color, border: `1px solid ${kybMeta.color}30` }}
              >
                {bizProfile.kybStatus === 'UNVERIFIED' ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {kybMeta.label}
              </Link>
            )}

            <button className="relative p-2 rounded-xl hover:bg-[#13131e] transition-colors">
              <Bell className="w-4 h-4 text-[#4a4a6a]" />
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--az-black)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
