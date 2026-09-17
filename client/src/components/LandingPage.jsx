import React from 'react';
import { 
  CheckCircle, ArrowRight, PauseCircle, Calendar, PhoneCall, 
  Calculator, ShieldCheck, HeartHandshake, Zap, Sparkles, Utensils
} from 'lucide-react';

export default function LandingPage({ onExploreDashboard, onOpenNewSub }) {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* 1. HERO SECTION & WHAT IT IS */}
      <section style={{
        padding: '70px 0 60px 0',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container-custom">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-amber-glow)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--color-amber-light)',
            padding: '6px 14px',
            borderRadius: '24px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
            <Sparkles size={16} />
            The Operating System for Home-Style Tiffin Delivery
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Every customer billed <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>only for the days</span> actually served.
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}>
            <strong>TiffinFlow</strong> automates monthly weekday lunch subscriptions with 1-click pause for travel and festivals, instant phone lookup, live morning kitchen dispatch, and mathematical pro-rated month-end billing.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={onExploreDashboard} 
              className="btn-primary" 
              style={{ fontSize: '1.05rem', padding: '14px 28px' }}
            >
              Launch Live App & Billing
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={onOpenNewSub} 
              className="btn-secondary" 
              style={{ fontSize: '1.05rem', padding: '14px 24px' }}
            >
              + Subscribe Customer
            </button>
          </div>

          {/* Highlights bar */}
          <div style={{
            marginTop: '50px',
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#10b981" /> Mon–Fri Weekday Logic
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#10b981" /> 1-Click Vacation Pause
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#10b981" /> Instant Phone Search
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#10b981" /> Zero Diary Calculations
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT IT IS (IN-DEPTH BREAKDOWN) */}
      <section className="container-custom" style={{ marginBottom: '70px' }}>
        <div className="glass-card" style={{ padding: '40px', borderLeft: '4px solid var(--color-amber)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-amber)'
            }}>
              <Utensils size={30} />
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '10px' }}>
                Section 1: What is TiffinFlow?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
                TiffinFlow is a dedicated subscription management and pro-rated billing application built specifically for home-style lunch delivery services. Customers subscribe to a monthly plan for lunch delivered each weekday (Monday to Friday). When life happens — festivals, vacation, or unexpected leaves — subscribers can pause deliveries. At month-end, TiffinFlow calculates transparent, pro-rated bills that charge subscribers strictly for the days food was delivered, completely eliminating payment friction and manual WhatsApp math.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY FEATURES */}
      <section className="container-custom" style={{ marginBottom: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '12px' }}>
            Section 2: Key Features
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Engineered precisely for the real-world operational challenges of tiffin owners.
          </p>
        </div>

        <div className="grid-cols-auto-fit">
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <PauseCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              1-Click Date-Range Pause
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Customers can pause for specific dates (e.g. Diwali break: Sept 14–18). The system automatically tracks paused vs active weekdays and halts meal dispatch for those dates.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Calculator size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Automated Pro-Rated Billing
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Calculates daily weekday rate <code>(Monthly Price / Total Weekdays)</code> and bills customers only for <code>(Delivered Days × Daily Rate)</code>. Generates itemized month-end invoices.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <PhoneCall size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Instant Phone Lookup
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              When a customer calls, type 3 digits of their phone number to instantly see their current status, active plan, dietary notes, pause logs, and live month-end balance.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Kitchen Dispatch Board
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Morning kitchen sheet that cleanly separates <strong>Active to Cook</strong> vs <strong>Paused Today</strong>, showing exact meal varieties (Veg, Jain, High Protein) and delivery addresses.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TARGET AUDIENCE */}
      <section className="container-custom" style={{ marginBottom: '70px' }}>
        <div className="glass-card" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>
            Section 3: Target Audience
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Designed for anyone running subscription meal or lunch delivery operations.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(11, 17, 32, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '8px' }}>👩‍🍳 Home Chefs & Kitchens</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Individuals cooking healthy homemade dabbas for office professionals who need simple, reliable customer tracking.
              </p>
            </div>

            <div style={{ background: 'rgba(11, 17, 32, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '8px' }}>🚲 Commercial Tiffin Providers</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Caterers and dabbawalas delivering 50–500 meals daily to IT corridors, hostels, and universities.
              </p>
            </div>

            <div style={{ background: 'rgba(11, 17, 32, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '8px' }}>🥗 Diet & Meal-Prep Services</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Keto, vegan, and gym meal providers offering customized weekday lunch subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT HELPS */}
      <section className="container-custom" style={{ marginBottom: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '12px' }}>
            Section 4: How It Helps
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            The tangible business impact of switching from paper diaries to TiffinFlow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '30px' }}>
            <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Eliminates Month-End Payment Disputes
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              No more arguments about <em>"I went home for 4 days during Rakhi!"</em>. The system provides an undisputed, itemized calendar bill proving every active and paused weekday.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <Zap size={32} color="#f59e0b" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Cuts Daily Food Wastage to Zero
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              By checking the morning Kitchen Dispatch board, the cook prepares exactly the required number of rotis and portions, saving an estimated 12–18% on raw grocery expenses.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <HeartHandshake size={32} color="#38bdf8" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '10px' }}>
              Builds Unshakable Customer Trust
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Customers love knowing that when they go out of town, they are genuinely not paying for food they didn't eat. Retention rates surge.
            </p>
          </div>
        </div>
      </section>

      {/* 6. THREE FEATURES TO BUILD NEXT */}
      <section className="container-custom" style={{ marginBottom: '50px' }}>
        <div className="glass-card" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(23, 37, 66, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
          <div style={{ display: 'inline-block', background: 'var(--color-amber-glow)', color: 'var(--color-amber)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
            ROADMAP & VISION
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>
            Section 5: Three Features We Would Build Next
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '1.05rem' }}>
            Next-generation enhancements planned for Version 2.0:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(11, 17, 32, 0.7)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📱 1.</div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
                WhatsApp AI Bot for 1-Click Pause
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Customers can simply WhatsApp: <em>"Pause my tiffin from tomorrow till Friday"</em>. Natural language processing parses dates, pauses the subscription, and confirms automatically.
              </p>
            </div>

            <div style={{ background: 'rgba(11, 17, 32, 0.7)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🗺️ 2.</div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
                Delivery Boy GPS Route Optimizer
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Automated route sequencing based on active delivery addresses for the day. Excludes paused homes to save fuel and ensures 1:00 PM lunch delivery.
              </p>
            </div>

            <div style={{ background: 'rgba(11, 17, 32, 0.7)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💳 3.</div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
                UPI AutoPay & WhatsApp Bill PDF
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                On the 1st of each month, an itemized PDF bill is automatically sent to the customer's WhatsApp with a 1-click dynamic UPI payment link for instant settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="container-custom" style={{ textAlign: 'center' }}>
        <button 
          onClick={onExploreDashboard} 
          className="btn-primary" 
          style={{ fontSize: '1.1rem', padding: '16px 36px' }}
        >
          Open TiffinFlow Dashboard
          <ArrowRight size={20} />
        </button>
      </section>

    </div>
  );
}
