import React, { useState } from 'react';
import { Phone, Search, User, MapPin, Calendar, Clock, AlertCircle, CheckCircle2, PauseCircle, Calculator } from 'lucide-react';
import { api } from '../api';

export default function PhoneLookup({ onOpenPauseModal, onOpenBillModal }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.lookupPhone(phoneNumber.trim());
      setCustomerData(data);
    } catch (err) {
      setError(err.message || 'No customer found for this phone number.');
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (phone) => {
    setPhoneNumber(phone);
    setTimeout(() => {
      api.lookupPhone(phone)
        .then(data => { setCustomerData(data); setError(null); })
        .catch(err => { setError(err.message); setCustomerData(null); });
    }, 50);
  };

  return (
    <div className="glass-card" style={{ padding: '28px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--color-amber-glow)',
            color: 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Phone size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Instant Phone Lookup</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Look up customer immediately during calls or WhatsApp queries
            </p>
          </div>
        </div>

        {/* Quick demo click pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Try:</span>
          <button 
            type="button" 
            onClick={() => quickFill('9829012345')} 
            className="btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          >
            Amit (Active)
          </button>
          <button 
            type="button" 
            onClick={() => quickFill('9829054321')} 
            className="btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}
          >
            Pooja (Paused)
          </button>
        </div>
      </div>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input-control"
            placeholder="Enter customer phone number (e.g. 9829012345)..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
          {loading ? 'Searching...' : 'Lookup'}
        </button>
      </form>

      {error && (
        <div style={{
          background: 'var(--color-rose-glow)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {customerData && customerData.customer && (
        <div className="animate-fade-in" style={{
          background: 'rgba(11, 17, 32, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Customer Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '1.3rem', color: '#fff' }}>{customerData.customer.name}</h4>
                
                {customerData.customer.effective_today_status === 'PAUSED' ? (
                  <span className="badge badge-paused">
                    <PauseCircle size={14} /> Paused Today
                  </span>
                ) : (
                  <span className="badge badge-active">
                    <CheckCircle2 size={14} /> Active for Lunch
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Phone size={14} /> {customerData.customer.phone}
                {customerData.customer.email && ` • ${customerData.customer.email}`}
              </p>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> {customerData.customer.address}
              </p>

              {customerData.customer.dietary_notes && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--color-amber-light)', background: 'var(--color-amber-glow)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  🥗 Note: {customerData.customer.dietary_notes}
                </div>
              )}
            </div>

            {/* Plan & Actions */}
            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subscribed Plan</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {customerData.customer.plan_name || 'Standard Plan'}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-amber)' }}>
                  ₹{customerData.customer.monthly_price}/month ({customerData.customer.meal_type})
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onOpenPauseModal(customerData.customer)}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  <Calendar size={14} />
                  Manage Pause
                </button>

                <button
                  onClick={() => onOpenBillModal(customerData.customer)}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  <Calculator size={14} />
                  Calculate Bill
                </button>
              </div>
            </div>

          </div>

          {/* Pause History */}
          {customerData.pauseLogs && customerData.pauseLogs.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Registered Vacation / Festival Pauses:
              </span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                {customerData.pauseLogs.map(p => (
                  <div key={p.id} style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#fca5a5'
                  }}>
                    <strong>{p.start_date}</strong> to <strong>{p.end_date}</strong> — <em>{p.reason}</em>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
