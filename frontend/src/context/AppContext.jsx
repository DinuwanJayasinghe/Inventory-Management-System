// AppContext.jsx — Global State (API-connected, no mock data)
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { authAPI, getToken, setToken, clearToken } from '../services/api';

const initialState = {
  currentUser: null, isAuthenticated: false, authLoading: true, toasts: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'AUTH_RESOLVED': return { ...state, authLoading: false };
    case 'LOGIN':  return { ...state, currentUser: action.payload, isAuthenticated: true, authLoading: false };
    case 'LOGOUT': return { ...state, currentUser: null, isAuthenticated: false };
    case 'ADD_TOAST':    return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default: return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // On app load: verify existing token with GET /api/me to restore session
  useEffect(() => {
    const token = getToken();
    if (!token) { dispatch({ type: 'AUTH_RESOLVED' }); return; }
    authAPI.me()
      .then(res => dispatch({ type: 'LOGIN', payload: res.user }))
      .catch(() => { clearToken(); dispatch({ type: 'AUTH_RESOLVED' }); });
  }, []);

  const login = useCallback((token, user) => {
    setToken(token);
    dispatch({ type: 'LOGIN', payload: user });
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    clearToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  return (
    <AppContext.Provider value={{ state, login, logout, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
