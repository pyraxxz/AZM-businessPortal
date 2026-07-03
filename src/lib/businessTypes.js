/**
 * Business type configuration — drives type-specific dashboards, nav, and widgets.
 * Each business category maps to a "type" that determines which management
 * tools appear in the portal.
 *
 * Sentry tenet: "Disable (and explain), don't hide" — features not relevant
 * to a business type are shown but disabled with a tooltip explaining why.
 */

export const BUSINESS_TYPES = {
  TRANSIT: {
    label: 'Transit & Transport',
    icon: 'Bus',
    color: '#4f8ef7',
    category: 'LOGISTICS',
    navItems: ['transit', 'reservations', 'checkin', 'seatMap', 'guests', 'marketing', 'finance'],
    description: 'Manage trips, seat maps, bookings, and passenger check-ins',
  },
  RESTAURANT: {
    label: 'Restaurant',
    icon: 'UtensilsCrossed',
    color: '#f59e0b',
    category: 'FOOD_BEVERAGE',
    navItems: ['reservations', 'checkin', 'dineIn', 'tables', 'guests', 'marketing', 'finance'],
    description: 'Manage reservations, table availability, dine-in tabs, and guest check-ins',
  },
  HOTEL: {
    label: 'Hotel',
    icon: 'Building2',
    color: '#a78bfa',
    category: 'REAL_ESTATE',
    navItems: ['reservations', 'checkin', 'rooms', 'showcase', 'guests', 'marketing', 'finance'],
    description: 'Manage room bookings, showcase gallery, availability, and guest check-ins',
  },
  RETAIL: {
    label: 'Retail',
    icon: 'ShoppingBag',
    color: '#00d97e',
    category: 'RETAIL',
    navItems: ['checkin', 'marketing', 'finance'],
    description: 'Manage products, orders, and customer check-ins',
  },
  SERVICES: {
    label: 'Services',
    icon: 'Briefcase',
    color: '#00b8d9',
    category: 'FREELANCE_SERVICES',
    navItems: ['reservations', 'checkin'],
    description: 'Manage appointments, bookings, and client check-ins',
  },
  GENERAL: {
    label: 'General Business',
    icon: 'Store',
    color: '#7b7b9a',
    category: 'OTHER',
    navItems: ['checkin'],
    description: 'Manage orders, products, and customer engagement',
  },
};

/** Map a business category to a business type */
export function getBusinessType(category) {
  const map = {
    'LOGISTICS': 'TRANSIT',
    'FOOD_BEVERAGE': 'RESTAURANT',
    'REAL_ESTATE': 'HOTEL',
    'RETAIL': 'RETAIL',
    'FREELANCE_SERVICES': 'SERVICES',
    'TECHNOLOGY': 'GENERAL',
    'EDUCATION': 'SERVICES',
    'HEALTH_WELLNESS': 'SERVICES',
    'ENTERTAINMENT': 'GENERAL',
    'FINANCIAL_SERVICES': 'GENERAL',
    'OTHER': 'GENERAL',
  };
  return map[category] || 'GENERAL';
}

/** Get the type config for a business profile */
export function getTypeConfig(bizProfile) {
  const type = getBusinessType(bizProfile?.category);
  return { type, ...BUSINESS_TYPES[type] };
}

/** Check if a business type has a specific feature */
export function hasFeature(bizProfile, feature) {
  const config = getTypeConfig(bizProfile);
  return config.navItems.includes(feature);
}

// ── Nav item definitions ────────────────────────────────────────────────────
export const MARKETPLACE_NAV = {
  transit: { label: 'Transit Trips', icon: 'Bus', to: '/transit' },
  reservations: { label: 'Reservations', icon: 'CalendarCheck', to: '/reservations' },
  checkin: { label: 'Check-In', icon: 'QrCode', to: '/checkin' },
  reviews: { label: 'Reviews', icon: 'Star', to: '/reviews' },
  tables: { label: 'Tables', icon: 'Grid3x3', to: '/locations' },
  rooms: { label: 'Rooms', icon: 'BedDouble', to: '/locations' },
  dineIn: { label: 'Dine-In Tabs', icon: 'Utensils', to: '/dine-in' },
  marketing: { label: 'Marketing', icon: 'Megaphone', to: '/marketing' },
  finance: { label: 'Finance', icon: 'Wallet', to: '/finance' },
  showcase: { label: 'Showcase', icon: 'showcase', to: '/showcase' },
  seatMap: { label: 'Seat Map Editor', icon: 'seatMap', to: '/seat-map' },
  guests: { label: 'Guests', icon: 'guests', to: '/guests' },
};
