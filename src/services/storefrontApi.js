import { request } from '@/lib/apiCore';

const BASE = '/api/storefront';
const STAKE_BASE = '/api/azm-stake';

async function sfRequest(path, options) {
  try {
    const response = await request(path, options);
    return response.data !== undefined ? response.data : response;
  } catch (err) {
    throw err;
  }
}

export const storefrontApi = {
  // Public
  getPublishedLayout: (businessId) => sfRequest(`${BASE}/${businessId}/render`),
  listThemes: (category) => sfRequest(`${BASE}/themes${category ? `?category=${category}` : ''}`),
  listWidgets: (category) => sfRequest(`${BASE}/widgets${category ? `?category=${category}` : ''}`),
  listTemplates: (category) => sfRequest(`${BASE}/templates${category ? `?category=${category}` : ''}`),

  // Authenticated (uses /me/ prefix)
  getDraftLayout: () => sfRequest(`${BASE}/me/draft`),
  getPublished: () => sfRequest(`${BASE}/me/published`),
  checkEligibility: () => sfRequest(`${BASE}/me/eligibility`),

  saveDraftLayout: (layoutJson, themeId, expectedUpdatedAt) =>
    sfRequest(`${BASE}/me/draft`, {
      method: 'PUT',
      body: JSON.stringify({ layoutJson, themeId, expectedUpdatedAt }),
    }),

  publishLayout: () =>
    sfRequest(`${BASE}/me/publish`, { method: 'POST' }),

  getHistory: (limit) => sfRequest(`${BASE}/me/history${limit ? `?limit=${limit}` : ''}`),

  revertToVersion: (versionId) =>
    sfRequest(`${BASE}/me/revert`, { method: 'POST', body: JSON.stringify({ versionId }) }),

  applyTemplate: (templateId) =>
    sfRequest(`${BASE}/me/apply-template`, { method: 'POST', body: JSON.stringify({ templateId }) }),

  recordEvent: (eventType, metadata) =>
    sfRequest(`${BASE}/me/analytics`, { method: 'POST', body: JSON.stringify({ eventType, metadata }) }),

  // AZM Staking
  getStakes: () => sfRequest(`${STAKE_BASE}/stakes`),
  getTierInfo: () => sfRequest(`${STAKE_BASE}/tier`),
  createStake: (amountAzm) =>
    sfRequest(`${STAKE_BASE}/create`, { method: 'POST', body: JSON.stringify({ amountAzm }) }),
  requestUnstake: (stakeId) =>
    sfRequest(`${STAKE_BASE}/unstake`, { method: 'POST', body: JSON.stringify({ stakeId }) }),
};
