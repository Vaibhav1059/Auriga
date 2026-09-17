import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function NewSubscriptionModal({ onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPlans()
      .then(data => {
        setPlans(data.plans || []);
        if (data.plans && data.plans.length > 0) {
          setPlanId(data.plans[0].id);
        }
      })
      .catch(err => console.error('Failed to load plans:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !address || !planId) {
      setError('Please fill in Name, Phone, Address, and Plan.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Create customer
      const custRes = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        dietary_notes: dietaryNotes.trim()
      });

      // 2. Create subscription
      await api.createSubscription({
        customer_id: custRes.customer.id,
        plan_id: parseInt(planId, 10),
        start_date: startDate,
        notes: notes.trim()
      });

      onSuccess(`New customer ${name} successfully subscribed!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        position: 'relative'
      }}>
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
            background: 'var(--color-amber-glow)',
            color: 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Add New Subscriber</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Onboard a customer to weekday lunch delivery
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--color-rose-glow)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Phone Number *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. 9829012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              className="input-control"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Delivery Address (Office / Flat) *
            </label>
            <textarea
              className="input-control"
              rows={2}
              placeholder="Flat 302, Green Valley Apt, Malviya Nagar..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Select Monthly Plan *
              </label>
              <select
                className="input-control"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.monthly_price}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Start Date *
              </label>
              <input
                type="date"
                className="input-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Dietary Notes & Instructions
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Jain / No Garlic, Less Oil, Deliver at 12:45 PM"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Activating...' : 'Activate Subscription'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
