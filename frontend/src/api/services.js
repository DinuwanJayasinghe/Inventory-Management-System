/**
 * api/services.js
 * ─────────────────────────────────────────────────────────
 * All API service functions are grouped by resource.
 * Each function returns the Axios promise — components
 * await these and handle loading/error state themselves.
 *
 * Naming convention:
 *   auth.*        → Authentication endpoints
 *   users.*       → User management (admin only)
 *   cupboards.*   → Cupboard CRUD
 *   places.*      → Place CRUD
 *   items.*       → Inventory item CRUD + quantity
 *   borrowings.*  → Borrow / return workflow
 *   logs.*        → Activity log queries
 * ─────────────────────────────────────────────────────────
 */

import apiClient from './client';

// ── AUTH ─────────────────────────────────────────────────
export const auth = {
  // POST /login → returns { token, user }
  login: (email, password) =>
    apiClient.post('/login', { email, password }),

  // POST /logout → revokes the current Sanctum token
  logout: () =>
    apiClient.post('/logout'),

  // GET /me → returns the currently authenticated user
  me: () =>
    apiClient.get('/me'),
};

// ── USERS ────────────────────────────────────────────────
export const users = {
  // GET /users → paginated list (admin only)
  list: (params = {}) =>
    apiClient.get('/users', { params }),

  // POST /users → create new user (admin only)
  create: (data) =>
    apiClient.post('/users', data),

  // PUT /users/:id → update user role or details
  update: (id, data) =>
    apiClient.put(`/users/${id}`, data),

  // DELETE /users/:id → soft delete
  remove: (id) =>
    apiClient.delete(`/users/${id}`),
};

// ── CUPBOARDS ────────────────────────────────────────────
export const cupboards = {
  list: (params = {}) =>
    apiClient.get('/cupboards', { params }),

  get: (id) =>
    apiClient.get(`/cupboards/${id}`),

  create: (data) =>
    apiClient.post('/cupboards', data),

  update: (id, data) =>
    apiClient.put(`/cupboards/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/cupboards/${id}`),
};

// ── PLACES ───────────────────────────────────────────────
export const places = {
  // GET /places?cupboard_id=xxx — filter by cupboard
  list: (params = {}) =>
    apiClient.get('/places', { params }),

  get: (id) =>
    apiClient.get(`/places/${id}`),

  create: (data) =>
    apiClient.post('/places', data),

  update: (id, data) =>
    apiClient.put(`/places/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/places/${id}`),
};

// ── ITEMS ────────────────────────────────────────────────
export const items = {
  // GET /items with optional filters: status, place_id, search
  list: (params = {}) =>
    apiClient.get('/items', { params }),

  get: (id) =>
    apiClient.get(`/items/${id}`),

  // POST /items with multipart/form-data for image upload
  create: (formData) =>
    apiClient.post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    apiClient.post(`/items/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  remove: (id) =>
    apiClient.delete(`/items/${id}`),

  // PATCH /items/:id/quantity → { type: 'increment'|'decrement', amount }
  // Handled by InventoryService on backend with lockForUpdate()
  adjustQuantity: (id, type, amount) =>
    apiClient.patch(`/items/${id}/quantity`, { type, amount }),

  // PATCH /items/:id/status → { status: 'damaged'|'missing'|'in_store' }
  updateStatus: (id, status) =>
    apiClient.patch(`/items/${id}/status`, { status }),
};

// ── BORROWINGS ───────────────────────────────────────────
export const borrowings = {
  // GET /borrowings?status=active|returned|overdue
  list: (params = {}) =>
    apiClient.get('/borrowings', { params }),

  get: (id) =>
    apiClient.get(`/borrowings/${id}`),

  // POST /borrowings → creates record, deducts stock, updates item status
  create: (data) =>
    apiClient.post('/borrowings', data),

  // POST /borrowings/:id/return → restores stock, updates status to returned
  returnItem: (id) =>
    apiClient.post(`/borrowings/${id}/return`),
};

// ── ACTIVITY LOGS ────────────────────────────────────────
export const logs = {
  // GET /activity-logs?action=xxx&model_type=xxx&per_page=50
  list: (params = {}) =>
    apiClient.get('/activity-logs', { params }),
};

// ── DASHBOARD STATS ──────────────────────────────────────
export const dashboard = {
  // GET /dashboard → { total_items, active_borrowings, damaged, missing, recent_activity }
  stats: () =>
    apiClient.get('/dashboard'),
};
