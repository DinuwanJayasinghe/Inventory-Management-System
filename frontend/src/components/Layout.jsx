/**
 * components/Layout.jsx
 * ─────────────────────────────────────────────────────────
 * App shell that wraps all authenticated pages.
 *
 * ProtectedRoute: Guards routes that require login.
 *   - If not logged in → redirect to /login
 *   - If adminOnly and user is not admin → redirect to /
 *
 * Layout: Sidebar + main content area.
 *   - Sidebar is fixed on the left.
 *   - <Outlet /> renders the active page component on the right.
 * ─────────────────────────────────────────────────────────
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

// ── ProtectedRoute ───────────────────────────────────────
// Wrap any route that requires authentication.
// Optional adminOnly prop restricts access to admin users only.
export function ProtectedRoute({ adminOnly = false }) {
  const { user } = useAuth();

  // Not logged in → go to login page
  if (!user) return <Navigate to="/login" replace />;

  // Staff trying to access admin-only page → go to dashboard
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  // All good → render the child route's component via <Outlet />
  return <Outlet />;
}

// ── Layout ───────────────────────────────────────────────
// The main authenticated shell: sidebar on the left, page content on the right.
export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Fixed sidebar — always visible */}
      <Sidebar />

      {/* Scrollable main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
