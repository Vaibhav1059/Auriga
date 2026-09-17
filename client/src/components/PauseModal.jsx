import React, { useState } from 'react';
import { X, PauseCircle, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function PauseModal({ customer, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('Travel / Festival leave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.pauseSubscription(customer.subscription_id, {
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });
      onSuccess(`Successfully scheduled pause from ${startDate} to ${endDate} for ${customer.name}`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule pause.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '30px', position: 'relative' }}>
        
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--color-rose-glow)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PauseCircle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Pause Subscription</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              For <strong>{customer.name}</strong> ({customer.phone})
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Customer will <strong>not be billed</strong> for weekdays falling in this pause window. The kitchen will automatically skip dispatch.
        </p>

        {error && (
          <div style={{ background: 'var(--color-rose-glow)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Pause Start Date
              </label>
              <input
                type="date"
                className="input-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Pause End Date (Inclusive)
              </label>
              <input
                type="date"
                className="input-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Reason for Leave / Pause
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Diwali Vacation, Travelling to Mumbai, Sick"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#f43f5e', color: '#fff' }}>
              {loading ? 'Confirming...' : 'Confirm Pause'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
