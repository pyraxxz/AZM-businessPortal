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

// === DINE-IN ===
openDineInTab: (bizId, azmId) => api.post(`/business-market/${bizId}/dine-in/open`, { azmId }),
finalizeDineInTab: (tabId, items) => api.post(`/business-market/dine-in/${tabId}/finalize`, { items }),
getGuests: (bizId) => api.get(`/business-market/${bizId}/guests`),
searchGuest: (bizId, query) => api.get(`/business-market/${bizId}/guests/search`, { params: { q: query } }),
getFollowerStats: (bizId) => api.get(`/business-market/${bizId}/followers/stats`),
getAdPosts: (bizId) => api.get(`/business-market/${bizId}/ads`),
createAdPost: (bizId, data) => api.post(`/business-market/${bizId}/ads`, data),
getFinanceStats: (bizId) => api.get(`/business-market/${bizId}/finance/stats`),
getFinanceTransactions: (bizId) => api.get(`/business-market/${bizId}/finance/transactions`),
getShowcase: (bizId) => api.get(`/business-market/${bizId}/showcase`),
addShowcaseSlide: (bizId, data) => api.post(`/business-market/${bizId}/showcase`, data),
removeShowcaseSlide: (bizId, slideId) => api.delete(`/business-market/${bizId}/showcase/${slideId}`),
reorderShowcase: (bizId, slides) => api.patch(`/business-market/${bizId}/showcase/reorder`, { slides }),
getSeatMap: (bizId, tripId) => api.get(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
saveSeatMap: (bizId, tripId, layout) => api.put(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { layout }),
getPenaltyPolicy: (bizId) => api.get(`/business-market/${bizId}/penalty-policy`),
updatePenaltyPolicy: (bizId, data) => api.put(`/business-market/${bizId}/penalty-policy`, data),
counterProposeReservation: (bizId, resId, data) => api.post(`/business-market/${bizId}/reservations/${resId}/counter-propose`, data),
acceptCounterProposal: (bizId, resId) => api.post(`/business-market/${bizId}/reservations/${resId}/accept-counter`),
getKybStatus: (bizId) => api.get(`/business-market/${bizId}/kyb`),
submitKyb: (bizId, docs) => api.post(`/business-market/${bizId}/kyb/submit`, { documents: docs }),

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

// === DINE-IN ===
openDineInTab: (bizId, azmId) => api.post(`/business-market/${bizId}/dine-in/open`, { azmId }),
finalizeDineInTab: (tabId, items) => api.post(`/business-market/dine-in/${tabId}/finalize`, { items }),
getGuests: (bizId) => api.get(`/business-market/${bizId}/guests`),
searchGuest: (bizId, query) => api.get(`/business-market/${bizId}/guests/search`, { params: { q: query } }),
getFollowerStats: (bizId) => api.get(`/business-market/${bizId}/followers/stats`),
getAdPosts: (bizId) => api.get(`/business-market/${bizId}/ads`),
createAdPost: (bizId, data) => api.post(`/business-market/${bizId}/ads`, data),
getFinanceStats: (bizId) => api.get(`/business-market/${bizId}/finance/stats`),
getFinanceTransactions: (bizId) => api.get(`/business-market/${bizId}/finance/transactions`),
getShowcase: (bizId) => api.get(`/business-market/${bizId}/showcase`),
addShowcaseSlide: (bizId, data) => api.post(`/business-market/${bizId}/showcase`, data),
removeShowcaseSlide: (bizId, slideId) => api.delete(`/business-market/${bizId}/showcase/${slideId}`),
reorderShowcase: (bizId, slides) => api.patch(`/business-market/${bizId}/showcase/reorder`, { slides }),
getSeatMap: (bizId, tripId) => api.get(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
saveSeatMap: (bizId, tripId, layout) => api.put(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { layout }),
getPenaltyPolicy: (bizId) => api.get(`/business-market/${bizId}/penalty-policy`),
updatePenaltyPolicy: (bizId, data) => api.put(`/business-market/${bizId}/penalty-policy`, data),
counterProposeReservation: (bizId, resId, data) => api.post(`/business-market/${bizId}/reservations/${resId}/counter-propose`, data),
acceptCounterProposal: (bizId, resId) => api.post(`/business-market/${bizId}/reservations/${resId}/accept-counter`),
getKybStatus: (bizId) => api.get(`/business-market/${bizId}/kyb`),
submitKyb: (bizId, docs) => api.post(`/business-market/${bizId}/kyb/submit`, { documents: docs }),

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

// === DINE-IN ===
openDineInTab: (bizId, azmId) => api.post(`/business-market/${bizId}/dine-in/open`, { azmId }),
finalizeDineInTab: (tabId, items) => api.post(`/business-market/dine-in/${tabId}/finalize`, { items }),
getGuests: (bizId) => api.get(`/business-market/${bizId}/guests`),
searchGuest: (bizId, query) => api.get(`/business-market/${bizId}/guests/search`, { params: { q: query } }),
getFollowerStats: (bizId) => api.get(`/business-market/${bizId}/followers/stats`),
getAdPosts: (bizId) => api.get(`/business-market/${bizId}/ads`),
createAdPost: (bizId, data) => api.post(`/business-market/${bizId}/ads`, data),
getFinanceStats: (bizId) => api.get(`/business-market/${bizId}/finance/stats`),
getFinanceTransactions: (bizId) => api.get(`/business-market/${bizId}/finance/transactions`),
getShowcase: (bizId) => api.get(`/business-market/${bizId}/showcase`),
addShowcaseSlide: (bizId, data) => api.post(`/business-market/${bizId}/showcase`, data),
removeShowcaseSlide: (bizId, slideId) => api.delete(`/business-market/${bizId}/showcase/${slideId}`),
reorderShowcase: (bizId, slides) => api.patch(`/business-market/${bizId}/showcase/reorder`, { slides }),
getSeatMap: (bizId, tripId) => api.get(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
saveSeatMap: (bizId, tripId, layout) => api.put(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { layout }),
getPenaltyPolicy: (bizId) => api.get(`/business-market/${bizId}/penalty-policy`),
updatePenaltyPolicy: (bizId, data) => api.put(`/business-market/${bizId}/penalty-policy`, data),
counterProposeReservation: (bizId, resId, data) => api.post(`/business-market/${bizId}/reservations/${resId}/counter-propose`, data),
acceptCounterProposal: (bizId, resId) => api.post(`/business-market/${bizId}/reservations/${resId}/accept-counter`),
getKybStatus: (bizId) => api.get(`/business-market/${bizId}/kyb`),
submitKyb: (bizId, docs) => api.post(`/business-market/${bizId}/kyb/submit`, { documents: docs }),

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

// === DINE-IN ===
openDineInTab: (bizId, azmId) => api.post(`/business-market/${bizId}/dine-in/open`, { azmId }),
finalizeDineInTab: (tabId, items) => api.post(`/business-market/dine-in/${tabId}/finalize`, { items }),
getGuests: (bizId) => api.get(`/business-market/${bizId}/guests`),
searchGuest: (bizId, query) => api.get(`/business-market/${bizId}/guests/search`, { params: { q: query } }),
getFollowerStats: (bizId) => api.get(`/business-market/${bizId}/followers/stats`),
getAdPosts: (bizId) => api.get(`/business-market/${bizId}/ads`),
createAdPost: (bizId, data) => api.post(`/business-market/${bizId}/ads`, data),
getFinanceStats: (bizId) => api.get(`/business-market/${bizId}/finance/stats`),
getFinanceTransactions: (bizId) => api.get(`/business-market/${bizId}/finance/transactions`),
getShowcase: (bizId) => api.get(`/business-market/${bizId}/showcase`),
addShowcaseSlide: (bizId, data) => api.post(`/business-market/${bizId}/showcase`, data),
removeShowcaseSlide: (bizId, slideId) => api.delete(`/business-market/${bizId}/showcase/${slideId}`),
reorderShowcase: (bizId, slides) => api.patch(`/business-market/${bizId}/showcase/reorder`, { slides }),
getSeatMap: (bizId, tripId) => api.get(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
saveSeatMap: (bizId, tripId, layout) => api.put(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { layout }),
getPenaltyPolicy: (bizId) => api.get(`/business-market/${bizId}/penalty-policy`),
updatePenaltyPolicy: (bizId, data) => api.put(`/business-market/${bizId}/penalty-policy`, data),
counterProposeReservation: (bizId, resId, data) => api.post(`/business-market/${bizId}/reservations/${resId}/counter-propose`, data),
acceptCounterProposal: (bizId, resId) => api.post(`/business-market/${bizId}/reservations/${resId}/accept-counter`),
getKybStatus: (bizId) => api.get(`/business-market/${bizId}/kyb`),
submitKyb: (bizId, docs) => api.post(`/business-market/${bizId}/kyb/submit`, { documents: docs }),

};

// ── Marketplace Stats (aggregate dashboard) ─────────────────────────────────
export const marketplaceStats = {
  overview: () => request('/api/business/marketplace/stats'),

// === DINE-IN ===
openDineInTab: (bizId, azmId) => api.post(`/business-market/${bizId}/dine-in/open`, { azmId }),
finalizeDineInTab: (tabId, items) => api.post(`/business-market/dine-in/${tabId}/finalize`, { items }),
getGuests: (bizId) => api.get(`/business-market/${bizId}/guests`),
searchGuest: (bizId, query) => api.get(`/business-market/${bizId}/guests/search`, { params: { q: query } }),
getFollowerStats: (bizId) => api.get(`/business-market/${bizId}/followers/stats`),
getAdPosts: (bizId) => api.get(`/business-market/${bizId}/ads`),
createAdPost: (bizId, data) => api.post(`/business-market/${bizId}/ads`, data),
getFinanceStats: (bizId) => api.get(`/business-market/${bizId}/finance/stats`),
getFinanceTransactions: (bizId) => api.get(`/business-market/${bizId}/finance/transactions`),
getShowcase: (bizId) => api.get(`/business-market/${bizId}/showcase`),
addShowcaseSlide: (bizId, data) => api.post(`/business-market/${bizId}/showcase`, data),
removeShowcaseSlide: (bizId, slideId) => api.delete(`/business-market/${bizId}/showcase/${slideId}`),
reorderShowcase: (bizId, slides) => api.patch(`/business-market/${bizId}/showcase/reorder`, { slides }),
getSeatMap: (bizId, tripId) => api.get(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`),
saveSeatMap: (bizId, tripId, layout) => api.put(`/business-market/${bizId}/transit/trips/${tripId}/seatmap`, { layout }),
getPenaltyPolicy: (bizId) => api.get(`/business-market/${bizId}/penalty-policy`),
updatePenaltyPolicy: (bizId, data) => api.put(`/business-market/${bizId}/penalty-policy`, data),
counterProposeReservation: (bizId, resId, data) => api.post(`/business-market/${bizId}/reservations/${resId}/counter-propose`, data),
acceptCounterProposal: (bizId, resId) => api.post(`/business-market/${bizId}/reservations/${resId}/accept-counter`),
getKybStatus: (bizId) => api.get(`/business-market/${bizId}/kyb`),
submitKyb: (bizId, docs) => api.post(`/business-market/${bizId}/kyb/submit`, { documents: docs }),

};
