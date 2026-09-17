import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@tiffinflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res;
      if (isLogin) {
        res = await api.login({ email, password });
      } else {
        res = await api.register({ name, email, password, role: 'owner' });
      }

      localStorage.setItem('tiffinflow_token', res.token);
      localStorage.setItem('tiffinflow_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@tiffinflow.com');
    setPassword('admin123');
    setIsLogin(true);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '30px', position: 'relative' }}>
        
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--color-amber-glow)',
            color: 'var(--color-amber)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>
            {isLogin ? 'Owner Login' : 'Register Tiffin Business'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {isLogin ? 'Access your dashboard & kitchen dispatch' : 'Create an account to start managing subscriptions'}
          </p>
        </div>

        {/* Demo login shortcut pill */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={fillDemoAdmin}
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--color-amber-light)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} />
            Quick Demo: Load Pre-Seeded Owner Credentials
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--color-rose-glow)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Chef Rajesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-control"
              placeholder="owner@tiffinflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              className="input-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {isLogin ? (
            <span>Don't have an account? <button type="button" onClick={() => { setIsLogin(false); setError(null); }} style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 600 }}>Sign up</button></span>
          ) : (
            <span>Already registered? <button type="button" onClick={() => { setIsLogin(true); setError(null); }} style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 600 }}>Log in</button></span>
          )}
        </div>

      </div>
    </div>
  );
}
