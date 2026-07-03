import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { KYB_STATUS_META } from '@/lib/utils';
import { useBizNotifications } from '@/hooks/useBizNotifications';
import { getTypeConfig, MARKETPLACE_NAV } from '@/lib/businessTypes';
import { LayoutDashboard, Calendar, Package, ShoppingBag, ScanLine, Utensils, Users, Star, Image, Grid3x3, Megaphone, Wallet, Receipt, Settings, Menu, X, Bell, LogOut, ChevronDown, Building2, MapPin } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Icon mapping for business types
const TYPE_ICONS = {
  Bus, UtensilsCrossed, Building2, ShoppingIcon, Briefcase, Store,
};

// Icon mapping for marketplace nav items
const NAV_ICONS = {
  transit: Bus,
  reservations: CalendarCheck,
  checkin: QrCode,
  reviews: Star,
  tables: MapPin,
  rooms: BedDouble,
};

const BASE_NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/' },
  { label: 'Orders',     icon: ShoppingBag,      to: '/orders' },
  { label: 'Products',   icon: Package,          to: '/products' },
  { label: 'Invoices',   icon: Receipt,          to: '/invoices' },
  { label: 'Locations',  icon: MapPin,           to: '/locations' },
];

const BOTTOM_NAV = [
  { label: 'Reviews',      icon: Star,            to: '/reviews' },
  { label: 'Notifications', icon: Bell,           to: '/notifications' },
  { label: 'Verification',  icon: FileCheck,      to: '/kyb' },
  { label: 'Settings',     icon: Settings,        to: '/settings' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { bizProfile, user, logout } = useAuth();

  useBizNotifications();

  const typeConfig = getTypeConfig(bizProfile);
  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];
  const TypeIcon = TYPE_ICONS[typeConfig.icon] || Store;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = (bizProfile?.businessName || user?.username || 'B').charAt(0).toUpperCase();

  // Build type-specific nav items
  const marketplaceNavItems = typeConfig.navItems
    .map(key => MARKETPLACE_NAV[key])
    .filter(Boolean)
    .map(item => ({
      label: item.label,
      icon: NAV_ICONS[item.icon] || Star,
      to: item.to,
    }));

  // Group nav into sections
  const sections = [
    { label: 'Overview', items: BASE_NAV.slice(0, 1) }, // Dashboard
    { label: 'Commerce', items: BASE_NAV.slice(1) },    // Orders, Products, Invoices, Locations
  ];

  if (marketplaceNavItems.length > 0) {
    sections.splice(1, 0, { label: typeConfig.label, items: marketplaceNavItems });
  }

  sections.push({ label: 'Manage', items: BOTTOM_NAV });

  const renderNavItem = ({ label, icon: Icon, to }) => {
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
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--az-black)' }}>
      {/* Sidebar */}
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

        {/* Business pill with type badge */}
        {!collapsed && bizProfile && (
          <div className="mx-3 mt-3 p-3 rounded-xl border border-[#2a2a3e]" style={{ background: '#0a0a0f' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${typeConfig.color}1a`, border: `1px solid ${typeConfig.color}30` }}
              >
                <TypeIcon className="w-3.5 h-3.5" style={{ color: typeConfig.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#e8e8f0] truncate leading-tight">{bizProfile.businessName}</p>
                <p className="text-[10px] mt-0.5 font-medium truncate" style={{ color: typeConfig.color }}>
                  {typeConfig.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav sections */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-4 px-2">
          {sections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-[#3a3a5a] uppercase tracking-widest">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(renderNavItem)}
              </div>
            </div>
          ))}
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

      {/* Main */}
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
            <NotificationBell />
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
