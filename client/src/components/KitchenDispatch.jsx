import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, CheckCircle2, PauseCircle, Phone, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function KitchenDispatch({ onOpenPauseModal }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cook'); // 'cook' or 'paused'

  const fetchDispatch = async (date) => {
    setLoading(true);
    try {
      const data = await api.getKitchenDispatch(date);
      setDispatchData(data);
    } catch (err) {
      console.error('Failed to load kitchen dispatch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatch(selectedDate);
  }, [selectedDate]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <ChefHat size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>Kitchen Dispatch Board</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Morning prep count — Active lunch dabbas vs Paused subscribers
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              className="input-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ paddingLeft: '36px', width: '180px' }}
            />
            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button 
            onClick={() => fetchDispatch(selectedDate)} 
            className="btn-secondary" 
            style={{ padding: '10px' }}
            title="Refresh dispatch"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {dispatchData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Meals to Cook Today</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {dispatchData.summary.mealsToCookCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#10b981' }}>Dabbas</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {dispatchData.isWeekday ? 'Active Mon–Fri weekday delivery' : 'Weekend (No weekday delivery)'}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paused Customers Today</span>
              <PauseCircle size={18} color="#f43f5e" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {dispatchData.summary.pausedCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#f43f5e' }}>On Leave</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Excluded from today's cooking and billing
            </p>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Subscribers</span>
              <Calendar size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {dispatchData.summary.totalSubscriptions} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#f59e0b' }}>Total</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Monthly registered clients
            </p>
          </div>

        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('cook')}
          className={activeTab === 'cook' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 18px', fontSize: '0.9rem' }}
        >
          <CheckCircle2 size={16} />
          Active to Cook ({dispatchData ? dispatchData.cookList.length : 0})
        </button>

        <button
          onClick={() => setActiveTab('paused')}
          className={activeTab === 'paused' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 18px', fontSize: '0.9rem', background: activeTab === 'paused' ? '#f43f5e' : undefined }}
        >
          <PauseCircle size={16} />
          Paused Today ({dispatchData ? dispatchData.pausedList.length : 0})
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          Loading kitchen dispatch...
        </div>
      ) : activeTab === 'cook' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {dispatchData?.cookList.map((item) => (
            <div key={item.subscription_id} className="glass-card" style={{ padding: '20px', borderTop: '3px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1.15rem', color: '#fff' }}>{item.customer_name}</h4>
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                  {item.meal_type}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Phone size={14} /> {item.customer_phone}
              </p>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> {item.customer_address}
              </p>

              <div style={{
                background: 'rgba(11, 17, 32, 0.6)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '10px'
              }}>
                🍱 <strong>{item.plan_name}</strong>
                {item.dietary_notes && (
                  <div style={{ color: 'var(--color-amber-light)', marginTop: '4px' }}>
                    ⚠️ {item.dietary_notes}
                  </div>
                )}
              </div>

              <button
                onClick={() => onOpenPauseModal({ id: item.customer_id, subscription_id: item.subscription_id, name: item.customer_name })}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}
              >
                Set Future Pause
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {dispatchData?.pausedList.length === 0 ? (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
              🎉 No paused subscribers on this date. All customers active!
            </div>
          ) : (
            dispatchData?.pausedList.map((item) => (
              <div key={item.subscription_id} className="glass-card" style={{ padding: '20px', borderTop: '3px solid #f43f5e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1.15rem', color: '#fff' }}>{item.customer_name}</h4>
                  <span className="badge badge-paused" style={{ fontSize: '0.7rem' }}>
                    PAUSED
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Phone size={14} /> {item.customer_phone}
                </p>

                <div style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#fca5a5',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                    Reason: {item.pause_reason}
                  </div>
                  {item.pause_start && item.pause_end && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      Duration: {item.pause_start} to {item.pause_end}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  🚫 No lunch will be cooked or charged for today.
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
