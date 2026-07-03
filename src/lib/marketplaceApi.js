/**
 * Azaman Business Portal — Marketplace API layer
 * Extends the core API with transit, reservation, check-in, and review endpoints.
 * All calls go through the same authenticated request() as the core api.js.
 */
import { request } from './apiCore';

// ── Transit Trips ───────────────────────────────────────────────────────────
export const transit = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/transit/trips${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/api/business/transit/trips/${id}`),
  create: (data) => request('/api/business/transit/trips', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/business/transit/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/api/business/transit/trips/${id}`, { method: 'DELETE' }),
  // Seat map
  getSeatMap: (tripId) => request(`/api/business/transit/trips/${tripId}/seats`),
  updateSeatMap: (tripId, seats) => request(`/api/business/transit/trips/${tripId}/seats`, { method: 'PUT', body: JSON.stringify({ seats }) }),
  // Bookings for a trip
  bookings: (tripId) => request(`/api/business/transit/trips/${tripId}/bookings`),

};


// ── Reservations ────────────────────────────────────────────────────────────
export const reservations = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/reservations${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/api/business/reservations/${id}`),
  confirm: (id) => request(`/api/business/reservations/${id}/confirm`, { method: 'POST' }),
  cancel: (id, reason) => request(`/api/business/reservations/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  markNoShow: (id) => request(`/api/business/reservations/${id}/no-show`, { method: 'POST' }),
  stats: () => request('/api/business/reservations/stats'),

};


// ── Check-In ────────────────────────────────────────────────────────────────
export const checkIn = {
  verifyToken: (token) => request('/api/marketplace/checkin/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  searchByAzamanId: (azamanId) => request(`/api/marketplace/checkin/search?azamanId=${encodeURIComponent(azamanId)}`),
  directCheckIn: (reservationId) => request('/api/marketplace/checkin/direct', { method: 'POST', body: JSON.stringify({ reservationId }) }),
  todayStats: () => request('/api/business/checkin/stats'),
  recentCheckIns: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/checkin/recent${qs ? `?${qs}` : ''}`);
  },

};


// ── Reviews & Stories ───────────────────────────────────────────────────────
export const reviews = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/reviews${qs ? `?${qs}` : ''}`);
  },
  stats: () => request('/api/business/reviews/stats'),
  promoteToStory: (reviewId) => request(`/api/marketplace/reviews/${reviewId}/share-story`, { method: 'POST' }),
  stories: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/stories${qs ? `?${qs}` : ''}`);
  },

};


// ── Marketplace Stats (aggregate dashboard) ─────────────────────────────────
export const marketplaceStats = {
  overview: () => request('/api/business/marketplace/stats'),

};



export const marketplaceApi = {
  openDineInTab: (bizId, azmId) => request(`/api/business-market/${bizId}/dine-in/open`, { method: "POST", body: JSON.stringify({ azmId }) }),
  finalizeDineInTab: (tabId, items) => request(`/api/business-market/dine-in/${tabId}/finalize`, { method: "POST", body: JSON.stringify({ items }) }),
  getGuests: (bizId) => request(`/api/business-market/${bizId}/guests`),
  searchGuest: (bizId, query) => request(`/api/business-market/${bizId}/guests/search?q=${query}`),
  getFollowerStats: (bizId) => request(`/api/business-market/${bizId}/followers/stats`),
  getAdPosts: (bizId) => request(`/api/business-market/${bizId}/ads`),
  createAdPost: (bizId, data) => request(`/api/business-market/${bizId}/ads`, { method: "POST", body: JSON.stringify(data) }),
  getFinanceStats: (bizId) => request(`/api/business-market/${bizId}/finance/stats`),
  getFinanceTransactions: (bizId) => request(`/api/business-market/${bizId}/finance/transactions`),
  getShowcase: (bizId) => request(`/api/business-market/${bizId}/showcase`),
  addShowcaseSlide: (bizId, data) => request(`/api/business-market/${bizId}/showcase`, { method: "POST", body: JSON.stringify(data) }),
  removeShowcaseSlide: (bizId, slideId) => request(`/api/business-market/${bizId}/showcase/${slideId}`, { method: "DELETE" }),
  reorderShowcase: (bizId, slides) => request(`/api/business-market/${bizId}/showcase/reorder`, { method: "PATCH", body: JSON.stringify({ slides }) }),
  getSeatMap: (bizId, tripId) => request(`/api/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
  saveSeatMap: (bizId, tripId, layout) => request(`/api/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { method: "PUT", body: JSON.stringify({ layout }) }),
  getPenaltyPolicy: (bizId) => request(`/api/business-market/${bizId}/penalty-policy`),
  updatePenaltyPolicy: (bizId, data) => request(`/api/business-market/${bizId}/penalty-policy`, { method: "PUT", body: JSON.stringify(data) }),
  counterProposeReservation: (bizId, resId, data) => request(`/api/business-market/${bizId}/reservations/${resId}/counter-propose`, { method: "POST", body: JSON.stringify(data) }),
  acceptCounterProposal: (bizId, resId) => request(`/api/business-market/${bizId}/reservations/${resId}/accept-counter`, { method: "POST" }),
  getKybStatus: (bizId) => request(`/api/business-market/${bizId}/kyb`),
  submitKyb: (bizId, docs) => request(`/api/business-market/${bizId}/kyb/submit`, { method: "POST", body: JSON.stringify({ documents: docs }) })
};
