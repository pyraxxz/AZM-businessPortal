import { request } from './apiCore';

export const transit = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/business/transit/trips${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/api/business/transit/trips/${id}`),
  create: (data) => request('/api/business/transit/trips', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/business/transit/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/api/business/transit/trips/${id}`, { method: 'DELETE' }),
  getSeatMap: (tripId) => request(`/api/business/transit/trips/${tripId}/seats`),
  updateSeatMap: (tripId, seats) => request(`/api/business/transit/trips/${tripId}/seats`, { method: 'PUT', body: JSON.stringify({ seats }) }),
  bookings: (tripId) => request(`/api/business/transit/trips/${tripId}/bookings`),
};

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

export const marketplaceStats = {
  overview: () => request('/api/business/marketplace/stats'),
};

export const marketplaceApi = {
  // ── Dine-In (uses /api/dine-in/tabs) ─────────────────────────────────────
  openDineInTab: (businessProfileId, customerAzamanId) =>
    request('/api/dine-in/tabs', { method: "POST", body: JSON.stringify({ businessProfileId, customerAzamanId }) }),

  addDineInItem: (tabId, { productId, name, unitPriceUsdc, quantity }) =>
    request(`/api/dine-in/tabs/${tabId}/items`, { method: "POST", body: JSON.stringify({ productId, name, unitPriceUsdc, quantity }) }),

  finalizeDineInTab: (tabId, { taxRatePct, tipUsdc }) =>
    request(`/api/dine-in/tabs/${tabId}/finalize`, { method: "POST", body: JSON.stringify({ taxRatePct, tipUsdc }) }),

  getDineInTab: (tabId) => request(`/api/dine-in/tabs/${tabId}`),
  getOpenTabs: () => request('/api/dine-in/tabs'),
  confirmDineInTab: (tabId) => request(`/api/dine-in/tabs/${tabId}/pay`, { method: "POST", body: JSON.stringify({}) }),
  reportDineInDefault: (tabId, reason) => request(`/api/dine-in/tabs/${tabId}/default`, { method: "POST", body: JSON.stringify({ reason }) }),

  // ── Guests (uses /api/dine-in/guests) ────────────────────────────────────
  getGuests: () => request('/api/dine-in/guests'),
  searchGuest: (query) => request(`/api/dine-in/guests/search?q=${encodeURIComponent(query)}`),

  // ── Ad Posts (uses /api/ad-posts) ─────────────────────────────────────────
  getAdPosts: (businessProfileId) => request(`/api/ad-posts/active/${businessProfileId}`),
  createAdPost: (data) => request('/api/ad-posts', { method: "POST", body: JSON.stringify(data) }),
  deleteAdPost: (adPostId) => request(`/api/ad-posts/${adPostId}`, { method: "DELETE" }),
  getAdFeed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/ad-posts/feed${qs ? `?${qs}` : ''}`);
  },

  // ── Showcase (uses /api/showcases) ────────────────────────────────────────
  getShowcase: (businessProfileId) => request(`/api/showcases/${businessProfileId}`),
  addShowcaseSlide: (data) => request('/api/showcases', { method: "POST", body: JSON.stringify(data) }),
  updateShowcaseSlide: (slideId, data) => request(`/api/showcases/${slideId}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeShowcaseSlide: (slideId) => request(`/api/showcases/${slideId}`, { method: "DELETE" }),
  reorderShowcase: (slides) => request('/api/showcases/reorder', { method: "POST", body: JSON.stringify({ slides }) }),

  // ── Follows (uses /api/follows) ───────────────────────────────────────────
  followBusiness: (businessProfileId) => request('/api/follows', { method: "POST", body: JSON.stringify({ businessProfileId }) }),
  unfollowBusiness: (businessProfileId) => request(`/api/follows/${businessProfileId}`, { method: "DELETE" }),
  checkFollowing: (businessProfileId) => request(`/api/follows/check/${businessProfileId}`),
  getMyFollowing: () => request('/api/follows/following'),
  getMyFollowers: () => request('/api/follows/followers'),

  // ── Finance (uses /api/marketplace-finance) ──────────────────────────────
  getFinanceStats: () => request('/api/marketplace-finance/stats'),
  getFinanceTransactions: () => request('/api/marketplace-finance/transactions'),

  // ── Seat Map (uses /api/marketplace-seat-map) ─────────────────────────────
  getSeatMap: (tripId) => request(`/api/marketplace-seat-map/${tripId}`),
  saveSeatMap: (tripId, layout) => request(`/api/marketplace-seat-map/${tripId}`, { method: "PUT", body: JSON.stringify({ layout }) }),

  // ── Penalty Policy (uses /api/marketplace-penalty) ────────────────────────
  getPenaltyPolicy: () => request('/api/marketplace-penalty'),
  updatePenaltyPolicy: (data) => request('/api/marketplace-penalty', { method: "PUT", body: JSON.stringify(data) }),

  // ── Reservations: counter-propose (uses existing reservation routes) ──────
  counterProposeReservation: (resId, data) =>
    request(`/api/business/reservations/${resId}/counter-propose`, { method: "POST", body: JSON.stringify(data) }),
  acceptCounterProposal: (resId) =>
    request(`/api/business/reservations/${resId}/accept-counter`, { method: "POST" }),
};

// ── Employee Management ──────────────────────────────────────────────────
// All endpoints are under /api/business-os/ and use the request() function already imported at top of file

export const employeeApi = {
  getEmployees: () => request('/api/business-os/employees'),
  addEmployee: (data) => request('/api/business-os/employees', { method: 'POST', body: JSON.stringify(data) }),
  terminateEmployee: (id, reason) => request(`/api/business-os/employees/${id}/terminate`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getShifts: (start, end) => request(`/api/business-os/shifts?startDate=${start}&endDate=${end}`),
  createShift: (data) => request('/api/business-os/shifts', { method: 'POST', body: JSON.stringify(data) }),
  requestTimeOff: (data) => request('/api/business-os/time-off', { method: 'POST', body: JSON.stringify(data) }),
  processPayroll: (data) => request('/api/business-os/payroll/process', { method: 'POST', body: JSON.stringify(data) }),
};

export const financeApi = {
  getLedger: () => request('/api/business-os/ledger'),
  getCashFlow: (days = 30) => request(`/api/business-os/finance/cash-flow?days=${days}`),
  getPnl: (month) => request(`/api/business-os/finance/pnl?month=${month}`),
  payOut: (amount, destination) => request('/api/business-os/finance/payout', { method: 'POST', body: JSON.stringify({ amount, destination }) }),
};

export const hotelOpsApi = {
  getRooms: () => request('/api/business-os/hotel/rooms'),
  updateRoomStatus: (id, status) => request(`/api/business-os/hotel/rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getHousekeepingTasks: () => request('/api/business-os/hotel/housekeeping'),
  assignTask: (id, employeeId) => request(`/api/business-os/hotel/housekeeping/${id}/assign`, { method: 'PUT', body: JSON.stringify({ employeeId }) }),
};

export const restaurantOpsApi = {
  getKitchenOrders: () => request('/api/business-os/restaurant/kitchen'),
  updateOrderStatus: (id, status) => request(`/api/business-os/restaurant/kitchen/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getTables: () => request('/api/business-os/restaurant/tables'),
  updateTableStatus: (id, status) => request(`/api/business-os/restaurant/tables/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const transitOpsApi = {
  getVehicles: () => request('/api/business-os/transit/vehicles'),
  updateVehicleStatus: (id, status) => request(`/api/business-os/transit/vehicles/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getManifests: (date) => request(`/api/business-os/transit/manifests?date=${date}`),
};

export default marketplaceApi;
