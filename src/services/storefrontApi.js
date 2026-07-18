// src/services/storefrontApi.js
import { request } from '@/lib/apiCore';

const BASE = '/api/storefront';

async function sfRequest(path, options) {
  try {
    const response = await request(path, options);
    return response?.data !== undefined ? response.data : response;
  } catch (err) {
    throw err;
  }
}

export const storefrontApi = {
  // Public
  getPublishedLayout: (businessId) => sfRequest(`${BASE}/${businessId}/layout`),
  listThemes:         (category) => sfRequest(`${BASE}/themes${category ? `?category=${category}` : ''}`),
  listWidgets:        (category) => sfRequest(`${BASE}/widgets${category ? `?category=${category}` : ''}`),
  listTemplates:      (category) => sfRequest(`${BASE}/templates${category ? `?category=${category}` : ''}`),
  checkEligibility:   (businessId) => sfRequest(`${BASE}/${businessId}/eligibility`),

  // Authenticated (business owner)
  getDraftLayout: (businessId) => sfRequest(`${BASE}/${businessId}/draft`),
  saveDraftLayout: (businessId, layoutJson, themeId, expectedUpdatedAt) =>
    sfRequest(`${BASE}/${businessId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ layoutJson, themeId, expectedUpdatedAt }),
    }),
  publishLayout: (businessId) =>
    sfRequest(`${BASE}/${businessId}/publish`, { method: 'POST' }),
  getHistory: (businessId, limit) =>
    sfRequest(`${BASE}/${businessId}/history${limit ? `?limit=${limit}` : ''}`),
  revertToVersion: (businessId, versionId) =>
    sfRequest(`${BASE}/${businessId}/revert/${versionId}`, { method: 'POST' }),
  applyTemplate: (businessId, templateId) =>
    sfRequest(`${BASE}/${businessId}/apply-template/${templateId}`, { method: 'POST' }),
  uploadMedia: (businessId, formData) =>
    sfRequest(`${BASE}/${businessId}/media`, {
      method: 'POST',
      headers: {},
      body: formData,
    }),

  // Public theme for WebOrdering
  getPublicTheme: (businessId) => sfRequest(`${BASE}/${businessId}/public-theme`),
};
