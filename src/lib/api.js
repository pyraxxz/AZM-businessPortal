/**
 * Azaman Business Portal — API layer
 * All calls go to VITE_API_URL (defaults to http://localhost:3000).
 * The JWT is stored in localStorage under 'biz_token'.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const token = localStorage.getItem('biz_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('biz_token');
    localStorage.removeItem('biz_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login:   (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:      () => request('/api/auth/me'),
};

// ── Business Profile ──────────────────────────────────────────────────────────
export const business = {
  me:       ()     => request('/api/business/me'),
  register: (data) => request('/api/business/register', { method: 'POST', body: JSON.stringify(data) }),
  update:   (data) => request('/api/business/profile',  { method: 'PATCH', body: JSON.stringify(data) }),
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

// ── KYB ───────────────────────────────────────────────────────────────────────
export const kyb = {
  status: () => request('/api/business/kyb/status'),
  submit: (documents) =>
    request('/api/business/kyb/submit', { method: 'POST', body: JSON.stringify({ documents }) }),
};
