/**
 * Azaman Business Portal — API layer
 * All calls go to VITE_API_URL (defaults to http://localhost:3000).
 * The JWT is stored in localStorage under 'biz_token'.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const token = localStorage.getItem('biz_token');

  // The login endpoint authenticates by email/password, so a 401 here means
  // "wrong credentials" — NOT an expired session. Let its real message reach
  // the login form instead of hijacking it into a redirect.
  const isLoginCall = path.startsWith('/api/auth/login');

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    const msg = data.message || data.error || 'Request failed';

    // A 401 on a PROTECTED call means the stored token is missing/expired.
    // Clear it and bounce to the app root. '/' is always served by a static
    // host even when SPA rewrites aren't configured, so this avoids the
    // "Not Found" page; React Router then renders the login screen.
    if (res.status === 401 && !isLoginCall) {
      localStorage.removeItem('biz_token');
      localStorage.removeItem('biz_user');
      if (window.location.pathname !== '/') window.location.replace('/');
      throw new Error('Session expired');
    }

    throw new Error(msg);
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  // POST /api/auth/login — returns { success, token, accessToken, user }
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

// ── Business Profile ──────────────────────────────────────────────────────────
export const business = {
  me:       ()      => request('/api/business/me'),
  register: (data)  => request('/api/business/register', { method: 'POST', body: JSON.stringify(data) }),
  update:   (data)  => request('/api/business/profile',  { method: 'PATCH', body: JSON.stringify(data) }),
  // Public storefront lookup (no auth required) — used by the profile preview.
  getPublic:(bizId) => request(`/api/business/${bizId}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const products = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/products${qs ? `?${qs}` : ''}`);
  },
  get:    (id)   => request(`/api/business/products/${id}`),
  create: (data) => request('/api/business/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/business/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id)   => request(`/api/business/products/${id}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orders = {
  list:         (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/orders${qs ? `?${qs}` : ''}`);
  },
  stats:        ()      => request('/api/business/orders/stats'),
  get:          (id)    => request(`/api/business/orders/${id}`),
  markDelivered:(id, deliveryNotes) =>
    request(`/api/business/orders/${id}/delivered`, { method: 'PATCH', body: JSON.stringify({ deliveryNotes }) }),
};

// ── Notifications ───────────────────────────────────────────────────────────────
export const notifications = {
  list:        (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/notifications${qs ? `?${qs}` : ''}`);
  },
  unreadCount: ()   => request('/api/business/notifications/unread-count'),
  markRead:    (id) => request(`/api/business/notifications/read/${id}`, { method: 'POST' }),
  markAllRead: ()   => request('/api/business/notifications/read-all', { method: 'POST' }),
};

// ── Escrow ──────────────────────────────────────────────────────────────────────
// The business owner is the escrow payee and a participant on the linked ticket,
// so these protected endpoints authorize them. `getForTicket` may 404 when a
// ticket has no escrow — callers must handle that gracefully.
export const escrow = {
  getForTicket: (ticketId)        => request(`/api/escrow/ticket/${ticketId}`),
  satisfy:      (escrowId)        => request('/api/escrow/satisfy', { method: 'POST', body: JSON.stringify({ escrowId }) }),
  dispute:      (escrowId, reason) => request('/api/escrow/dispute', { method: 'POST', body: JSON.stringify({ escrowId, reason }) }),
};

// ── Analytics ───────────────────────────────────────────────────────────────────
// The stats endpoint returns aggregate counts; the revenue trend is computed
// client-side from the orders list (see Dashboard).
export const analytics = {
  summary: () => request('/api/business/orders/stats'),
};

// ── Locations ─────────────────────────────────────────────────────────────────
export const locations = {
  list:         ()           => request('/api/business/locations'),
  create:       (data)       => request('/api/business/locations', { method: 'POST', body: JSON.stringify(data) }),
  update:       (id, data)   => request(`/api/business/locations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove:       (id)         => request(`/api/business/locations/${id}`, { method: 'DELETE' }),
  getPublic:    (bizId)      => request(`/api/business/${bizId}/locations`),
  searchNearby: (params)     => { const qs = new URLSearchParams(params).toString(); return request(`/api/business/search/nearby?${qs}`); },
  createTable:  (locId, lbl) => request(`/api/business/locations/${locId}/tables`, { method: 'POST', body: JSON.stringify({ label: lbl }) }),
  listTables:   (locId)      => request(`/api/business/locations/${locId}/tables`),
  deleteTable:  (tableId)    => request(`/api/business/tables/${tableId}`, { method: 'DELETE' }),
};

// ── Invoices (business-owner side) ────────────────────────────────────────────
export const invoices = {
  list:         (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/api/business/invoices${qs ? '?' + qs : ''}`); },
  get:          (id)          => request(`/api/business/invoices/${id}`),
  create:       (data)        => request('/api/business/invoices', { method: 'POST', body: JSON.stringify(data) }),
  send:         (id)          => request(`/api/business/invoices/${id}/send`, { method: 'POST' }),
  void:         (id)          => request(`/api/business/invoices/${id}/void`, { method: 'POST' }),
  lookupCustomer: (azamanId)  => request(`/api/business/customers/lookup?azamanId=${encodeURIComponent(azamanId)}`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = {
  list: (bizId, params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/api/business/${bizId}/reviews${qs ? '?' + qs : ''}`); },
};

// ── KYB ───────────────────────────────────────────────────────────────────────
export const kyb = {
  status: () => request('/api/business/kyb/status'),
  submit: (documents) =>
    request('/api/business/kyb/submit', { method: 'POST', body: JSON.stringify({ documents }) }),
};
