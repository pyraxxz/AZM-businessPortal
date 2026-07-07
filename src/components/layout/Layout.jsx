import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { KYB_STATUS_META } from '@/lib/utils';
import { useBizNotifications } from '@/hooks/useBizNotifications';
import { getTypeConfig, MARKETPLACE_NAV } from '@/lib/businessTypes';
import NotificationBell from './NotificationBell';
import { BusinessSelector } from './BusinessSelector';
import { PhonePreview } from '../PhonePreview';
import {
  LayoutDashboard, Package, ShoppingBag, Receipt, Settings, Bell, LogOut,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, MapPin, Bus, UtensilsCrossed,
  Building2, Briefcase, Store, CalendarCheck, QrCode, BedDouble, FileCheck,
  AlertCircle, CheckCircle2, Users, Wallet, Megaphone, Image as ImageIcon,
  Grid3x3, Star, Utensils, Smartphone, Search, LayoutGrid, Wrench, LineChart,
  Sparkles, ConciergeBell, ChefHat, LayoutDashboard as TableIcon, CarFront, ShipWheel, FileSpreadsheet,
} from 'lucide-react';

const TYPE_ICONS = { Bus, UtensilsCrossed, Building2, ShoppingBag, Briefcase, Store };

const NAV_ICONS = {
  transit: Bus, reservations: CalendarCheck, checkin: QrCode, reviews: Star,
  rooms: BedDouble, dineIn: Utensils, marketing: Megaphone,
  finance: Wallet, showcase: ImageIcon, seatMap: Grid3x3, guests: Users, inventory: Package,
  housekeeping: Sparkles, frontdesk: ConciergeBell, kitchen: ChefHat,
  tables: TableIcon, fleet: CarFront, drivers: ShipWheel, manifests: FileSpreadsheet,
};

const COMMERCE_NAV = [
  { label: 'Orders',    icon: ShoppingBag, to: '/orders' },
  { label: 'Products',  icon: Package,     to: '/products' },
  { label: 'Invoices',  icon: Receipt,     to: '/invoices' },
  { label: 'Locations', icon: MapPin,      to: '/locations' },
  { label: 'Employees', icon: Users,       to: '/employees' },
  { label: 'Finance',   icon: LineChart,   to: '/finance' },
];

const MANAGE_NAV = [
  { label: 'Reviews',       icon: Star,       to: '/reviews' },
  { label: 'Notifications', icon: Bell,       to: '/notifications' },
  { label: 'Verification',  icon: FileCheck,  to: '/kyb' },
  { label: 'Settings',      icon: Settings,   to: '/settings' },
];

const ADMIN_ALL_NAV = [
  // General marketplace
  { label: 'Transit Trips',   icon: Bus,           to: '/transit' },
  { label: 'Reservations',    icon: CalendarCheck, to: '/reservations' },
  { label: 'Check-In',        icon: QrCode,        to: '/checkin' },
  { label: 'Dine-In Tabs',    icon: Utensils,      to: '/dine-in' },
  { label: 'Marketing',       icon: Megaphone,     to: '/marketing' },
  { label: 'Finance',         icon: Wallet,        to: '/finance' },
  { label: 'Showcase',        icon: ImageIcon,     to: '/showcase' },
  { label: 'Seat Map Editor', icon: Grid3x3,       to: '/transit' },
  { label: 'Guests',          icon: Users,         to: '/guests' },
  { label: 'Reviews',         icon: Star,          to: '/reviews' },
  // Hotel operations
  { label: 'Room Status',     icon: BedDouble,     to: '/hotel-rooms' },
  { label: 'Housekeeping',    icon: Sparkles,      to: '/hotel-housekeeping' },
  { label: 'Front Desk',      icon: ConciergeBell, to: '/hotel-front-desk' },
  // Restaurant operations
  { label: 'Kitchen (KDS)',   icon: ChefHat,       to: '/restaurant-kitchen' },
  { label: 'Table Map',       icon: TableIcon,     to: '/restaurant-tables' },
  // Transit operations
  { label: 'Fleet Status',    icon: CarFront,      to: '/transit-fleet' },
  { label: 'Drivers',         icon: ShipWheel, to: '/transit-drivers' },
  { label: 'Manifests',       icon: FileSpreadsheet, to: '/transit-manifests' },
];

export default function Layout() {
  const [paneCollapsed, setPaneCollapsed] = useState(false);
  const [flyout, setFlyout] = useState(null);
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [pinnedSectionKey, setPinnedSectionKey] = useState('dashboard');
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

  const marketplaceNavItems = (typeConfig.navItems || [])
    .map(key => MARKETPLACE_NAV[key])
    .filter(Boolean)
    .map(item => ({ label: item.label, icon: NAV_ICONS[item.icon] || Star, to: item.to }));

  // ── Rail sections ──
  // Admin always gets "All Business Tools" for testing, plus a type-specific
  // section when a business is selected so they can see both views.
  // NOTE: for admins, the business-type-specific section ('type') is listed
  // BEFORE the generic 'tools' (All Business Tools) section. Several routes
  // (e.g. Front Desk, Housekeeping) appear in both lists, and the active
  // section is resolved by the first array match — so ordering 'type' first
  // ensures clicking a business-specific tool keeps the sidebar pinned to
  // that business's section instead of jumping to "All Business Tools".
  const railSections = isAdmin
    ? [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, direct: '/' },
        { key: 'commerce',  label: 'Commerce', icon: ShoppingBag, items: COMMERCE_NAV },
        ...(marketplaceNavItems.length > 0
          ? [{ key: 'type', label: typeConfig.label, icon: TypeIcon, items: marketplaceNavItems }]
          : []),
        { key: 'tools',     label: 'All Business Tools', icon: LayoutGrid, items: ADMIN_ALL_NAV },
        { key: 'manage',    label: 'Manage', icon: Wrench, items: MANAGE_NAV },
      ]
    : [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, direct: '/' },
        { key: 'commerce',  label: 'Commerce', icon: ShoppingBag, items: COMMERCE_NAV },
        ...(marketplaceNavItems.length > 0
          ? [{ key: 'type', label: typeConfig.label, icon: TypeIcon, items: marketplaceNavItems }]
          : []),
        { key: 'manage', label: 'Manage', icon: Wrench, items: MANAGE_NAV },
      ];

  // Determine active section from route
  const activeSection = railSections.find(s =>
    s.direct ? location.pathname === s.direct
             : s.items?.some(i => location.pathname === i.to || (i.to !== '/' && location.pathname.startsWith(i.to)))
  ) || railSections[0];

  // Sync pinned section to active route when route changes
  useEffect(() => {
    if (activeSection) setPinnedSectionKey(activeSection.key);
  }, [activeSection?.key]);

  const displaySection = railSections.find(s => s.key === pinnedSectionKey) || activeSection;

  const handleRailClick = (section) => {
    if (section.direct) {
      navigate(section.direct);
      setFlyout(null);
      return;
    }
    if (paneCollapsed) {
      setFlyout(flyout === section.key ? null : section.key);
    } else {
      setPinnedSectionKey(section.key);
    }
  };

  const isItemActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  // ── PROMPT 1: Magic Hover with Framer Motion layoutId ──
  // The active background and left-border accent are motion.div elements
  // with a shared layoutId. When the active item changes, Framer Motion
  // smoothly slides the highlight to the new position with a spring.
  const renderPaneItem = (item) => {
    const active = isItemActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setFlyout(null)}
        className={cn(
          'nav-sentry relative px-3 py-2 text-sm',
          active ? 'text-[var(--sn-purple)] font-semibold' : 'text-[var(--sn-text-muted)]'
        )}
      >
        {/* Magic hover: active background glides between items */}
        {active && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 rounded-md bg-[var(--sn-purple-subtle)]"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        {/* Magic hover: left-border accent glides between items */}
        {active && (
          <motion.div
            layoutId="sidebar-active-accent"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--sn-purple)] rounded-r-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <item.icon className="w-4 h-4 flex-shrink-0 relative z-10" />
        <span className="truncate relative z-10">{item.label}</span>
      </Link>
    );
  };

  // Rail icon active indicator (also uses layoutId for smooth glide)
  const renderRailIcon = (section) => {
    const isActive = section.key === displaySection.key || (section.direct && location.pathname === section.direct);
    return (
      <div key={section.key} className="relative group w-full flex justify-center">
        <button
          onClick={() => handleRailClick(section)}
          className={cn(
            'btn-sentry w-10 h-10 rounded-lg flex items-center justify-center relative',
            isActive ? 'text-[var(--sn-purple)]' : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text-secondary)] hover:bg-[var(--sn-hover)]'
          )}
        >
          {isActive && (
            <motion.div
              layoutId="rail-active-bg"
              className="absolute inset-0 rounded-lg bg-[var(--sn-purple-subtle)]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <section.icon className="w-[18px] h-[18px] relative z-10" />
        </button>
        {/* Tooltip */}
        <div className="tooltip-sentry absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {section.label}
        </div>
        {/* Flyout popout (when Pane 2 is collapsed) */}
        {paneCollapsed && flyout === section.key && section.items && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-2 top-0 w-56 rounded-lg border border-[var(--sn-border-bright)] shadow-sn-dropdown py-2 px-1.5 z-50"
            style={{ background: 'var(--sn-elevated)' }}
          >
            <p className="px-2.5 pb-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--sn-text-muted)] border-b border-[var(--sn-border)]">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(renderPaneItem)}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--sn-black)' }}>
      {/* ── PANE 1 — Global icon rail ── */}
      <aside
        ref={railRef}
        className="w-14 flex-shrink-0 flex flex-col items-center py-3 border-r border-[var(--sn-border)] relative z-20"
        style={{ background: 'var(--sn-black)' }}
      >
        {/* Logo */}
        <Link to="/" className="w-9 h-9 rounded-lg bg-[var(--sn-purple-subtle)] border border-[var(--sn-purple-border)] flex items-center justify-center mb-4 flex-shrink-0 overflow-hidden">
          <img src="/azaman-logo.png" alt="Azaman" className="w-5 h-5 object-contain" />
        </Link>

        {/* Section icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 w-full px-1.5">
          {railSections.map(renderRailIcon)}
        </nav>

        {/* Phone preview trigger */}
        {bizProfile && (
          <div className="relative group w-full flex justify-center mb-1">
            <button
              onClick={() => setShowPhonePreview(true)}
              className="btn-sentry w-10 h-10 rounded-lg flex items-center justify-center text-[var(--sn-text-muted)] hover:text-[var(--sn-purple)] hover:bg-[var(--sn-hover)]"
            >
              <Smartphone className="w-[18px] h-[18px]" />
            </button>
            <div className="tooltip-sentry absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              Live Preview
            </div>
          </div>
        )}

        {/* User avatar → account popover (hover or click) */}
        <div
          ref={profileRef}
          className="relative group w-full flex justify-center"
          onMouseEnter={() => setProfileMenuOpen(true)}
          onMouseLeave={() => setProfileMenuOpen(false)}
        >
          <button
            onClick={() => setProfileMenuOpen(v => !v)}
            className="btn-sentry w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--sn-blue-subtle)] text-[var(--sn-blue)] font-bold text-xs"
          >
            {initial}
          </button>

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -6, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full ml-2 bottom-0 w-56 rounded-lg border border-[var(--sn-border-bright)] shadow-sn-dropdown z-50 overflow-hidden"
                style={{ background: 'var(--sn-elevated)' }}
              >
                <div className="px-3.5 py-3 border-b border-[var(--sn-border)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--sn-blue-subtle)] text-[var(--sn-blue)] font-bold text-xs flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--sn-text)] truncate">
                      {bizProfile?.businessName || user?.username || 'Account'}
                    </p>
                    <p className="text-xs text-[var(--sn-text-muted)] truncate">
                      {user?.email || user?.username || 'Signed in'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--sn-text-secondary)] hover:bg-[var(--sn-hover)] hover:text-[var(--sn-text)] transition-colors"
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

              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
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

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--sn-black)' }}>
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
