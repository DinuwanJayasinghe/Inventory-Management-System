// LoginPage.jsx — Real API login via Laravel Sanctum
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const { login, toast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      // POST /api/login → { token, user }
      const res = await authAPI.login(email, password);
      login(res.token, res.user);   // store token + user in context
      toast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="logo-mark" style={{ width: 44, height: 44, fontSize: 20 }}>C</div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Ceyntics IMS</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Internal Inventory Management System</p>
        </div>

        <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 24, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Shield size={14} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Access restricted to authorized staff. Contact your administrator to create an account.
          </span>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="you@ceyntics.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPwd ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>{error}</div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15, marginTop: 4 }}>
            {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0a0d14', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Default credentials:</strong><br />
          Admin: admin@ceyntics.com / Admin@1234<br />
          Staff: staff@ceyntics.com / Staff@1234
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
