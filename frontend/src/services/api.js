// =============================================================
//  api.js — Centralized API service layer
//
//  All HTTP calls to the Laravel backend go through this file.
//  Benefits:
//    - Single place to change base URL or auth headers
//    - Token injection happens automatically via interceptor
//    - Error handling is centralized
//
//  Usage in components:
//    import api from '../services/api'
//    const { data } = await api.items.list({ status: 'in_store' })
// =============================================================

// Base URL of the Laravel API — change for production
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Token helpers ──────────────────────────────────────────────
// Token is stored in localStorage so it persists across page refreshes.
// In a high-security app, use httpOnly cookies instead (Sanctum SPA mode).
const getToken  = ()        => localStorage.getItem('ims_token');
const setToken  = (token)   => localStorage.setItem('ims_token', token);
const clearToken = ()       => localStorage.removeItem('ims_token');

// ── Core fetch wrapper ─────────────────────────────────────────
// Wraps native fetch with:
//   - Auto JSON headers
//   - Auto Bearer token injection
//   - Consistent error handling
//   - Auto logout on 401
async function request(method, path, body = null, isFormData = false) {
  const token = getToken();

  const headers = {};
  headers['Accept'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json'; // let browser set for FormData

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  // Auto logout if token is invalid/expired
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return;
  }

  const json = await res.json().catch(() => ({}));

  // Throw error with server message for catch blocks in components
  if (!res.ok) {
    const message = json.message || json.error || 'Request failed';
    const error   = new Error(message);
    error.errors  = json.errors || {}; // Laravel validation errors
    error.status  = res.status;
    throw error;
  }

  return json;
}

// Convenience methods
const get  = (path, params)   => request('GET', path + (params ? '?' + new URLSearchParams(params) : ''));
const post = (path, body)     => request('POST', path, body);
const put  = (path, body)     => request('PUT', path, body);
const del  = (path)           => request('DELETE', path);
const postForm = (path, form) => request('POST', path, form, true);  // for file uploads

// ── API endpoints ──────────────────────────────────────────────

export const authAPI = {
  // POST /api/login → { token, user }
  login: (email, password) => post('/login', { email, password }),

  // POST /api/logout
  logout: () => post('/logout'),

  // GET /api/me → { user }
  me: () => get('/me'),
};

export const dashboardAPI = {
  // GET /api/dashboard → { stats, chart_data, recent_logs }
  get: () => get('/dashboard'),
};

export const itemsAPI = {
  // GET /api/items?search=&status=
  list: (params) => get('/items', params),

  // GET /api/items/{id}
  get: (id) => get(`/items/${id}`),

  // POST /api/items (multipart for image)
  create: (formData) => postForm('/items', formData),

  // PUT /api/items/{id}
  update: (id, data) => put(`/items/${id}`, data),

  // DELETE /api/items/{id}
  delete: (id) => del(`/items/${id}`),

  // POST /api/items/{id}/status
  updateStatus: (id, status) => post(`/items/${id}/status`, { status }),
};

export const borrowingsAPI = {
  // GET /api/borrowings?status=
  list: (params) => get('/borrowings', params),

  // GET /api/borrowings/overdue
  overdue: () => get('/borrowings/overdue'),

  // POST /api/borrowings
  create: (data) => post('/borrowings', data),

  // POST /api/borrowings/{id}/return
  returnItem: (id) => post(`/borrowings/${id}/return`),
};

export const cupboardsAPI = {
  list:   ()          => get('/cupboards'),
  create: (data)      => post('/cupboards', data),
  update: (id, data)  => put(`/cupboards/${id}`, data),
  delete: (id)        => del(`/cupboards/${id}`),
};

export const placesAPI = {
  list:   (params)    => get('/places', params),
  create: (data)      => post('/places', data),
  update: (id, data)  => put(`/places/${id}`, data),
  delete: (id)        => del(`/places/${id}`),
};

export const usersAPI = {
  list:   ()          => get('/users'),
  create: (data)      => post('/users', data),
  update: (id, data)  => put(`/users/${id}`, data),
  delete: (id)        => del(`/users/${id}`),
};

export const logsAPI = {
  list: (params) => get('/logs', params),
};

// Export token helpers so AppContext can use them
export { getToken, setToken, clearToken };
