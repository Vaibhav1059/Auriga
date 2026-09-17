import React, { useState, useEffect } from 'react';
import { 
  Users, ChefHat, PauseCircle, IndianRupee, Sparkles, CheckCircle2, 
  Plus, Calendar 
} from 'lucide-react';
import { api } from '../api';
import PhoneLookup from './PhoneLookup';
import CustomerTable from './CustomerTable';

export default function Dashboard({ 
  onOpenPauseModal, 
  onOpenBillModal, 
  onOpenNewSub, 
  notification,
  onClearNotification 
}) {
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleResume = async (subscriptionId) => {
    try {
      await api.resumeSubscription(subscriptionId);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to resume subscription');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          background: 'var(--color-emerald-glow)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34d399',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
          <button 
            onClick={onClearNotification}
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        
        {/* Card 1: Active Subscribers */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Subscriptions</span>
            <Users size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {stats ? stats.activeSubscriptions : '...'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total {stats ? stats.totalCustomers : '0'} registered clients
          </p>
        </div>

        {/* Card 2: Meals to Cook Today */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Today's Lunch Count</span>
            <ChefHat size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
            {stats ? stats.mealsToCookToday : '...'} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>dabbas</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats?.isTodayWeekday ? 'Weekdays delivery active' : 'Weekend (No weekday delivery)'}
          </p>
        </div>

        {/* Card 3: Paused Today */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paused Customers</span>
            <PauseCircle size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {stats ? stats.pausedSubscriptions : '...'}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#fb7185' }}>
            {stats ? stats.pausedTodayCount : 0} customers on leave today
          </p>
        </div>

        {/* Card 4: Projected Monthly Revenue */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Projected Monthly Revenue</span>
            <IndianRupee size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            ₹{stats ? stats.projectedMonthlyRevenue.toLocaleString() : '...'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Auto-prorates at month end
          </p>
        </div>

      </div>

      {/* Instant Phone Search Bar (Problem storyline spotlight) */}
      <PhoneLookup
        onOpenPauseModal={onOpenPauseModal}
        onOpenBillModal={onOpenBillModal}
      />

      {/* Customer Subscription Table with Search, Sort & Pagination */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>All Subscribers & Monthly Plans</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Manage active/paused statuses and compute pro-rated month-end invoices
            </p>
          </div>

          <button onClick={onOpenNewSub} className="btn-primary" style={{ fontSize: '0.88rem', padding: '9px 16px' }}>
            <Plus size={16} /> New Subscriber
          </button>
        </div>

        <CustomerTable
          onOpenPauseModal={onOpenPauseModal}
          onOpenBillModal={onOpenBillModal}
          onResumeSubscription={handleResume}
          refreshTrigger={refreshTrigger}
        />
      </div>

    </div>
  );
}
