/**
 * Shared request core for the business portal API layer.
 * Extracted from api.js so marketplaceApi.js can reuse the same auth logic.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function request(path, options = {}) {
  const token = localStorage.getItem('biz_token');
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
