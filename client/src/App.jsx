import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import KitchenDispatch from './components/KitchenDispatch';
import PauseModal from './components/PauseModal';
import BillModal from './components/BillModal';
import NewSubscriptionModal from './components/NewSubscriptionModal';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeView, setActiveView] = useState('landing'); // 'landing', 'dashboard', 'dispatch'
  const [user, setUser] = useState(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pauseModalCustomer, setPauseModalCustomer] = useState(null);
  const [billModalCustomer, setBillModalCustomer] = useState(null);
  const [newSubModalOpen, setNewSubModalOpen] = useState(false);

  // Global notification banner
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Check saved user
    const savedUser = localStorage.getItem('tiffinflow_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tiffinflow_token');
    localStorage.removeItem('tiffinflow_user');
    setUser(null);
    setNotification('You have been logged out.');
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(prev => (prev === msg ? null : prev));
    }, 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewSub={() => setNewSubModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingTop: '30px' }}>
        <div className="container-custom">
          
          {activeView === 'landing' && (
            <LandingPage
              onExploreDashboard={() => setActiveView('dashboard')}
              onOpenNewSub={() => setNewSubModalOpen(true)}
            />
          )}

          {activeView === 'dashboard' && (
            <Dashboard
              onOpenPauseModal={(cust) => setPauseModalCustomer(cust)}
              onOpenBillModal={(cust) => setBillModalCustomer(cust)}
              onOpenNewSub={() => setNewSubModalOpen(true)}
              notification={notification}
              onClearNotification={() => setNotification(null)}
            />
          )}

          {activeView === 'dispatch' && (
            <KitchenDispatch
              onOpenPauseModal={(cust) => setPauseModalCustomer(cust)}
            />
          )}

        </div>
      </main>

      {/* Modals */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(userData) => {
            setUser(userData);
            showNotification(`Welcome, ${userData.name}!`);
          }}
        />
      )}

      {pauseModalCustomer && (
        <PauseModal
          customer={pauseModalCustomer}
          onClose={() => setPauseModalCustomer(null)}
          onSuccess={(msg) => showNotification(msg)}
        />
      )}

      {billModalCustomer && (
        <BillModal
          customer={billModalCustomer}
          onClose={() => setBillModalCustomer(null)}
        />
      )}

      {newSubModalOpen && (
        <NewSubscriptionModal
          onClose={() => setNewSubModalOpen(false)}
          onSuccess={(msg) => {
            showNotification(msg);
            setActiveView('dashboard');
          }}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            🍱 <strong>TiffinFlow</strong> — Built for Round 2 Builder Round Evaluation
          </div>
          <div>
            Mon–Fri Weekday Logic • 1-Click Vacation Pause • Pro-Rated Billing Engine
          </div>
        </div>
      </footer>

    </div>
  );
}
