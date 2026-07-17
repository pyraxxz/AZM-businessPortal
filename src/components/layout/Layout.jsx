import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { KYB_STATUS_META } from '@/lib/utils';
import { useBizNotifications } from '@/hooks/useBizNotifications';
import { usePermission } from '@/hooks/usePermission';
import { getTypeConfig } from '@/lib/businessTypes';
import NotificationBell from './NotificationBell';
import { BusinessSelector } from './BusinessSelector';
import { PhonePreview } from '../PhonePreview';
import {
  LayoutDashboard, Package, ShoppingBag, Receipt, Settings, Bell, LogOut,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, MapPin, Bus, UtensilsCrossed,
  Building2, Briefcase, Store, CalendarCheck, QrCode, BedDouble, FileCheck,
  AlertCircle, CheckCircle2, Users, CalendarDays, Wallet,
  Megaphone, Image as ImageIcon,
  Grid3x3, Star, Utensils, Smartphone, Search, LayoutGrid, Wrench, LineChart,
  Sparkles, ConciergeBell, ChefHat, LayoutDashboard as TableIcon, CarFront, ShipWheel, FileSpreadsheet,
} from 'lucide-react';

const TYPE_ICONS = { Bus, UtensilsCrossed, Building2, ShoppingBag, Briefcase, Store };

export default function Layout() {
  const [paneCollapsed, setPaneCollapsed] = useState(false);
  const [flyout, setFlyout] = useState(null);
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [pinnedSectionKey, setPinnedSectionKey] = useState('overview');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const railRef = useRef(null);
  const profileRef = useRef(null);
  const { bizProfile, user, logout, isAdmin, adminBusinesses, selectedBusinessId, selectBusiness } = useAuth();

  useBizNotifications();

  // Auto-collapse Pane 2 under lg breakpoint
  useEffect(() => {
    const check = () => { if (window.innerWidth < 1024) setPaneCollapsed(true); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close flyout on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (flyout && railRef.current && !railRef.current.contains(e.target)) setFlyout(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [flyout]);

  // Close profile menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (profileMenuOpen && profileRef.current && !profileRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileMenuOpen]);

  const typeConfig = isAdmin && !selectedBusinessId
    ? { label: 'Admin View-All', icon: 'Store', navItems: [], color: '#6C5FC7' }
    : getTypeConfig(bizProfile);

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];
  const TypeIcon = TYPE_ICONS[typeConfig.icon] || Store;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initial = (bizProfile?.businessName || user?.username || 'B').charAt(0).toUpperCase();

  // Properly Grouped Sidebar Navigation:
  const railSections = [
    {
      key: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/', perm: null },
        { label: 'Notifications', icon: Bell, to: '/notifications', perm: null },
      ],
    },
    {
      key: 'bookings-orders',
      label: 'Bookings & Orders',
      icon: CalendarCheck,
      items: [
        { label: 'Reservations', icon: CalendarCheck, to: '/reservations', perm: 'reservations.view' },
        { label: 'Orders', icon: ShoppingBag, to: '/orders', perm: 'orders.view' },
        { label: 'Invoices', icon: Receipt, to: '/invoices', perm: 'invoices.view' },
      ],
    },
    {
      key: 'vertical-ops',
      label: 'Vertical Ops',
      icon: LayoutGrid,
      items: [
        { label: 'Hotel Rooms', icon: BedDouble, to: '/hotel-rooms', perm: 'hotel.view' },
        { label: 'Front Desk', icon: ConciergeBell, to: '/hotel-front-desk', perm: 'hotel.view' },
        { label: 'Housekeeping', icon: Sparkles, to: '/hotel-housekeeping', perm: 'hotel.view' },
        { label: 'Restaurant Kitchen', icon: ChefHat, to: '/restaurant-kitchen', perm: 'restaurant.view' },
        { label: 'Tables', icon: TableIcon, to: '/restaurant-tables', perm: 'restaurant.view' },
        { label: 'Inventory', icon: Package, to: '/inventory', perm: 'inventory.view' },
        { label: 'Dine-In', icon: Utensils, to: '/dine-in', perm: 'restaurant.view' },
        { label: 'Transit Fleet', icon: CarFront, to: '/transit-fleet', perm: 'transit.view' },
        { label: 'Trips', icon: Bus, to: '/transit', perm: 'transit.view' },
        { label: 'Drivers', icon: ShipWheel, to: '/transit-drivers', perm: 'transit.view' },
        { label: 'Cargo', icon: FileSpreadsheet, to: '/transit-manifests', perm: 'transit.view' },
      ],
    },
    {
      key: 'workforce',
      label: 'Workforce',
      icon: Users,
      items: [
        { label: 'Employees', icon: Users, to: '/employees', perm: 'employees.view' },
        { label: 'Scheduling', icon: CalendarDays, to: '/scheduling', perm: 'shifts.view' },
        { label: 'Payroll', icon: Wallet, to: '/payroll', perm: 'payroll.view' },
        { label: 'Time Off', icon: CalendarCheck, to: '/time-off', perm: 'employees.view' },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      icon: LineChart,
      items: [
        { label: 'Finance', icon: LineChart, to: '/finance', perm: 'finance.view' },
      ],
    },
    {
      key: 'marketing',
      label: 'Marketing',
      icon: Megaphone,
      items: [
        { label: 'Marketing', icon: Megaphone, to: '/marketing', perm: 'marketing.view' },
        { label: 'Reviews', icon: Star, to: '/reviews', perm: 'reviews.view' },
        { label: 'Showcase', icon: ImageIcon, to: '/showcase', perm: 'marketing.view' },
      ],
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        { label: 'Settings', icon: Settings, to: '/settings', perm: null },
        { label: 'Locations', icon: MapPin, to: '/locations', perm: 'locations.view' },
      ],
    },
  ];

  // Filter nav sections by permission — hide items the user can't access
  const visibleSections = railSections
    .map(s => ({
      ...s,
      items: (s.items || []).filter(item => !item.perm || hasPermission(item.perm)),
    }))
    .filter(s => s.items.length > 0);

  // Determine active section from route
  const activeSection = visibleSections.find(s =>
    s.items?.some(i => location.pathname === i.to || (i.to !== '/' && location.pathname.startsWith(i.to)))
  ) || visibleSections[0];

  // Sync pinned section to active route when route changes
  useEffect(() => {
    if (activeSection) setPinnedSectionKey(activeSection.key);
  }, [activeSection?.key]);

  const displaySection = visibleSections.find(s => s.key === pinnedSectionKey) || activeSection;

  const handleRailClick = (section) => {
    if (paneCollapsed) {
      setFlyout(flyout === section.key ? null : section.key);
    } else {
      setPinnedSectionKey(section.key);
    }
  };

  const isItemActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const renderPaneItem = (item) => {
    const active = isItemActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setFlyout(null)}
        className={cn(
          'nav-sentry relative px-3 py-2 text-sm flex items-center gap-2.5 rounded-lg transition-colors',
          active ? 'text-[var(--sn-purple)] font-semibold' : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text)] hover:bg-[var(--sn-hover)]'
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 rounded-lg bg-[var(--sn-purple-subtle)]"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ zIndex: 0 }}
          />
        )}
        {active && (
          <motion.div
            layoutId="sidebar-active-accent"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--sn-purple)] rounded-r"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ zIndex: 1 }}
          />
        )}
        <item.icon className="w-4 h-4 relative" style={{ zIndex: 1 }} />
        <span className="relative truncate" style={{ zIndex: 1 }}>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden text-[var(--sn-text)]" style={{ background: 'var(--sn-black)' }}>
      {/* ── RAIL (PANE 1) ── */}
      <aside
        ref={railRef}
        className="w-16 flex-shrink-0 flex flex-col items-center border-r border-[var(--sn-border)] py-4 justify-between"
        style={{ background: 'var(--sn-surface)' }}
      >
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--sn-border)] shadow-md bg-[var(--sn-card)] overflow-hidden">
            <img src="/azaman-logo.png" className="w-6 h-6 object-contain" alt="AZM" />
          </Link>

          {/* Nav Rail Buttons */}
          <nav className="flex flex-col gap-2 w-full px-2">
            {visibleSections.map((section) => {
              const active = displaySection.key === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => handleRailClick(section)}
                  className={cn(
                    'btn-sentry relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150',
                    active ? 'text-[var(--sn-purple)] bg-[var(--sn-purple-subtle)]' : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text)] hover:bg-[var(--sn-hover)]'
                  )}
                  title={section.label}
                >
                  <section.icon className="w-5 h-5" />
                  {active && (
                    <motion.div
                      layoutId="rail-active"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--sn-purple)] rounded-l"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile dropdown and metadata */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-[var(--sn-purple)] text-[var(--az-black)] border border-[var(--sn-border)] flex items-center justify-center font-bold text-sm tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            {initial}
          </button>

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute left-14 bottom-0 w-56 rounded-2xl border border-[var(--sn-border)] shadow-2xl overflow-hidden py-1.5"
                style={{ background: 'var(--az-card)', zIndex: 100 }}
              >
                <div className="px-4 py-3 border-b border-[var(--sn-border)]">
                  <p className="text-sm font-bold text-[var(--sn-text)] truncate">{bizProfile?.businessName || user?.username || 'Azaman Business'}</p>
                  <p className="text-xs text-[var(--sn-text-muted)] truncate mt-0.5">{user?.email || 'portal@azaman.biz'}</p>
                </div>
                <button
                  onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--sn-text-secondary)] hover:bg-[var(--sn-hover)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" /> Account settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--sn-red)] hover:bg-[var(--sn-red-subtle)] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── PANE 2 — Contextual menu ── */}
      <AnimatePresence initial={false}>
        {!paneCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 224, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 flex flex-col border-r border-[var(--sn-border)] overflow-hidden"
            style={{ background: 'var(--sn-surface)' }}
          >
            <div className="w-56 flex flex-col h-full">
              <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--sn-border)] flex-shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--sn-text-muted)] leading-none">AZAMAN</p>
                  <p className="text-sm font-semibold text-[var(--sn-text)] mt-0.5">{displaySection.label}</p>
                </div>
                <button
                  onClick={() => setPaneCollapsed(true)}
                  className="btn-sentry w-7 h-7 rounded-md flex items-center justify-center text-[var(--sn-text-muted)] hover:text-[var(--sn-text-secondary)] hover:bg-[var(--sn-hover)] flex-shrink-0"
                  title="Collapse"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>

              {!isAdmin && bizProfile && (
                <div className="mx-3 mt-3 p-2.5 rounded-lg border border-[var(--sn-border)]" style={{ background: 'var(--sn-card)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                         style={{ background: `${typeConfig.color}1a`, border: `1px solid ${typeConfig.color}30` }}>
                      <TypeIcon className="w-3.5 h-3.5" style={{ color: typeConfig.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--sn-text)] truncate leading-tight">{bizProfile.businessName}</p>
                      <p className="text-[10px] mt-0.5 font-medium truncate" style={{ color: typeConfig.color }}>{typeConfig.label}</p>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="px-3 py-3 border-b border-[var(--sn-border)]">
                  <BusinessSelector />
                </div>
              )}

              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 animate-fade-in">
                {(displaySection.items || []).map(renderPaneItem)}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Expand handle when Pane 2 is collapsed */}
      {paneCollapsed && (
        <button
          onClick={() => setPaneCollapsed(false)}
          className="btn-sentry w-5 flex-shrink-0 flex items-center justify-center border-r border-[var(--sn-border)] hover:bg-[var(--sn-hover)] text-[var(--sn-text-muted)]"
          style={{ background: 'var(--sn-black)' }}
          title="Expand"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-[var(--sn-border)] flex items-center justify-between px-5 flex-shrink-0" style={{ background: 'var(--sn-surface)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--sn-text-muted)]">{displaySection.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--sn-text-muted)]" />
            <span className="text-[var(--sn-text)] font-medium">
              {bizProfile ? bizProfile.businessName : 'Overview'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bizProfile && bizProfile.kybStatus !== 'VERIFIED' && (
              <Link
                to="/kyb"
                className="btn-sentry flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
                style={{ background: kybMeta.bg, color: kybMeta.color, border: `1px solid ${kybMeta.color}30` }}
              >
                {bizProfile.kybStatus === 'UNVERIFIED' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {kybMeta.label}
              </Link>
            )}
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto animate-fade-in" style={{ background: 'var(--sn-black)' }}>
          <Outlet />
        </main>
      </div>

      {/* Phone Preview Modal */}
      <AnimatePresence>
        {showPhonePreview && bizProfile && (
          <PhonePreview business={bizProfile} onClose={() => setShowPhonePreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
