/**
 * api/client.js
 * ─────────────────────────────────────────────────────────
 * Central Axios instance for all API communication.
 * 
 * - Base URL is read from .env (VITE_API_URL)
 * - Every request automatically attaches the Sanctum Bearer token
 *   stored in localStorage after login.
 * - Response interceptor catches 401 (Unauthenticated) globally
 *   and redirects the user back to the login page.
 * ─────────────────────────────────────────────────────────
 */

import axios from 'axios';

// Create a custom axios instance so we don't pollute the global axios config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────
// Runs before EVERY request is sent.
// Reads the token from localStorage and injects it into the
// Authorization header so the Laravel Sanctum middleware can
// authenticate the user.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────
// Runs after EVERY response is received.
// If the server returns 401 (token expired / invalid),
// we clear localStorage and force the user to log in again.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login'; // Hard redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
