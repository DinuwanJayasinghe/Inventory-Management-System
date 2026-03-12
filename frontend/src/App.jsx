// App.jsx — Router with auth guard + token restore on page load
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import ItemsPage      from './pages/ItemsPage';
import BorrowingsPage from './pages/BorrowingsPage';
import StoragePage    from './pages/StoragePage';
import UsersPage      from './pages/UsersPage';
import LogsPage       from './pages/LogsPage';

// Shows spinner while verifying token on app load
function AuthGate({ children }) {
  const { state } = useApp();
  if (state.authLoading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <span style={{color:'var(--text-muted)',fontSize:14}}>Verifying session...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return children;
}

function ProtectedRoute({ children }) {
  const { state } = useApp();
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { state } = useApp();
  if (!state.isAuthenticated)         return <Navigate to="/login" replace />;
  if (state.currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/dashboard"  element={<ProtectedRoute><AppShell><DashboardPage/></AppShell></ProtectedRoute>}/>
        <Route path="/items"      element={<ProtectedRoute><AppShell><ItemsPage/></AppShell></ProtectedRoute>}/>
        <Route path="/borrowings" element={<ProtectedRoute><AppShell><BorrowingsPage/></AppShell></ProtectedRoute>}/>
        <Route path="/storage"    element={<ProtectedRoute><AppShell><StoragePage/></AppShell></ProtectedRoute>}/>
        <Route path="/users"      element={<AdminRoute><AppShell><UsersPage/></AppShell></AdminRoute>}/>
        <Route path="/logs"       element={<AdminRoute><AppShell><LogsPage/></AppShell></AdminRoute>}/>
        <Route path="/"  element={<Navigate to="/dashboard" replace/>}/>
        <Route path="*"  element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
    </AuthGate>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes/>
        <ToastContainer/>
      </BrowserRouter>
    </AppProvider>
  );
}
