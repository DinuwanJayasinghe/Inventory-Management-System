/**
 * context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────
 * Global authentication state using React Context API.
 *
 * What this does:
 *  1. Stores the current user object and token in state
 *  2. Persists token + user to localStorage so the session
 *     survives page refreshes
 *  3. Exposes login(), logout(), and isAdmin() helpers
 *     to every component in the app via useAuth() hook
 *
 * Usage:
 *   const { user, login, logout, isAdmin } = useAuth();
 * ─────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../api/services';

// Create the context object (empty by default)
const AuthContext = createContext(null);

// ── Provider Component ───────────────────────────────────
// Wrap the entire app with this so all children can access auth state.
export function AuthProvider({ children }) {
  // Initialize user from localStorage (so page refresh doesn't log out)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem('auth_token') || null
  );

  const [loading, setLoading] = useState(false);

  // ── login() ─────────────────────────────────────────
  // Called from LoginPage. Sends credentials to Laravel,
  // stores the returned token and user in state + localStorage.
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token: newToken, user: newUser } = res.data;

      // Persist to localStorage for session continuity
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // ── logout() ────────────────────────────────────────
  // Revokes the Sanctum token on the server, then clears local state.
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_) {
      // Even if server call fails, clear local state
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  // ── isAdmin() ────────────────────────────────────────
  // Convenience helper used in route guards and conditional UI rendering.
  const isAdmin = () => user?.role === 'admin';

  // Provide all values to child components
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth Hook ─────────────────────────────────────────
// Custom hook so components don't need to import useContext + AuthContext.
// Usage: const { user, isAdmin } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
