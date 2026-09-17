import React from 'react';
import { UtensilsCrossed, ChefHat, Users, Phone, LogIn, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, user, onOpenAuth, onLogout, onOpenNewSub }) {
  return (
    <header style={{
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveView('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b1120',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            <UtensilsCrossed size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Tiffin<span style={{ color: '#f59e0b' }}>Flow</span>
              </span>
              <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                Pro-Rated OS
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>
              Home-Style Tiffin Billing & Dispatch
            </p>
          </div>
        </div>

        {/* Center Nav Switcher */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveView('landing')}
            className={activeView === 'landing' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <Sparkles size={16} />
            Overview
          </button>
          
          <button
            onClick={() => setActiveView('dashboard')}
            className={activeView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <Users size={16} />
            Subscriptions & Bills
          </button>

          <button
            onClick={() => setActiveView('dispatch')}
            className={activeView === 'dispatch' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <ChefHat size={16} />
            Today's Dispatch
          </button>
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenNewSub}
            className="btn-outline-amber"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            + Add Subscriber
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{user.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-amber)' }}>{user.role.toUpperCase()}</p>
              </div>
              <button 
                onClick={onLogout} 
                className="btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth} 
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <LogIn size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
