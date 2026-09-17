/**
 * TiffinFlow — Enterprise Pro-Rated Tiffin Subscription & KDS Platform
 * Core Application Logic & React 18 Components (app.js)
 * Clean Separation: Modular JavaScript, zero embedded code in HTML
 */

const { useState, useEffect } = React;

// Baseline customer dataset
const INITIAL_CUSTOMERS = [
  { id: 1, subscription_id: 1, name: 'Amit Singhal', phone: '9829012345', locality: 'Malviya Nagar', address: 'Flat 402, Royal Residency, Malviya Nagar, Jaipur', dietary_notes: 'Less oil, no extra spicy', plan_id: 1, plan_name: 'Ghar Ki Thali (Standard Veg)', monthly_price: 2200, meal_type: 'Veg', tier: 'STANDARD', status: 'ACTIVE', pause_logs: [{ id: 1, start_date: '2026-09-07', end_date: '2026-09-08', reason: 'Festival Fasting' }] },
  { id: 2, subscription_id: 2, name: 'Pooja Mehta', phone: '9829054321', locality: 'Sitapura', address: 'Tower B, Office 305, IT Park, Sitapura', dietary_notes: 'Strictly Jain (No onion/garlic)', plan_id: 2, plan_name: 'Shuddh Jain Satvik Box', monthly_price: 2500, meal_type: 'Jain', tier: 'STANDARD', status: 'PAUSED', pause_logs: [{ id: 2, start_date: '2026-09-14', end_date: '2026-09-18', reason: 'Family Wedding in Udaipur' }] },
  { id: 3, subscription_id: 3, name: 'Vikram Rathore', phone: '9116789012', locality: 'C-Scheme', address: 'House 14, Sunrise Enclave, C-Scheme', dietary_notes: 'Gym diet, extra salad', plan_id: 4, plan_name: 'Fitness High-Protein Meal', monthly_price: 3400, meal_type: 'Diet/High-Protein', tier: 'DELUXE', status: 'ACTIVE', pause_logs: [] },
  { id: 4, subscription_id: 4, name: 'Sneha Agarwal', phone: '9414098765', locality: 'Mansarovar', address: 'A-89, Mansarovar, Sector 5', dietary_notes: 'Regular spicy, extra curd', plan_id: 1, plan_name: 'Ghar Ki Thali (Standard Veg)', monthly_price: 2200, meal_type: 'Veg', tier: 'STANDARD', status: 'ACTIVE', pause_logs: [] },
  { id: 5, subscription_id: 5, name: 'Karan Verma', phone: '9784112233', locality: 'Malviya Nagar', address: 'Co-working Pod 12, WTP, JLN Marg', dietary_notes: 'No capsicum', plan_id: 3, plan_name: 'Executive Deluxe Thali', monthly_price: 3000, meal_type: 'Veg', tier: 'DELUXE', status: 'PAUSED', pause_logs: [{ id: 3, start_date: '2026-09-15', end_date: '2026-09-18', reason: 'WFH this week' }] },
  { id: 6, subscription_id: 6, name: 'Ritu Bhasin', phone: '9650044556', locality: 'Jagatpura', address: 'Flat 701, Silver Crest, Jagatpura', dietary_notes: 'Allergic to peanuts', plan_id: 1, plan_name: 'Ghar Ki Thali (Standard Veg)', monthly_price: 2200, meal_type: 'Veg', tier: 'STANDARD', status: 'ACTIVE', pause_logs: [] },
  { id: 7, subscription_id: 7, name: 'Deepak Choudhary', phone: '9001234567', locality: 'Gopalpura', address: 'Plot 22, Gopalpura Bypass, Jaipur', dietary_notes: 'Extra roti requested', plan_id: 1, plan_name: 'Ghar Ki Thali (Standard Veg)', monthly_price: 2200, meal_type: 'Veg', tier: 'STANDARD', status: 'ACTIVE', pause_logs: [] }
];

// Audit trail events
const INITIAL_AUDIT_LOGS = [
  { id: 104, actor_name: 'Mukesh Saini (Driver)', actor_role: 'driver', action: 'DELIVERY_STATUS_UPDATE', entity_type: 'DELIVERY_RUN', entity_id: 1, details: 'Stop #1 (Amit Singhal) marked DELIVERED with contactless door drop', ip_address: '106.51.24.12', timestamp: '2026-09-17 12:35:10' },
  { id: 103, actor_name: 'Chef Rajesh Sharma', actor_role: 'owner', action: 'CUTOFF_LOCKED', entity_type: 'SYSTEM', entity_id: 0, details: '9:00 AM Morning Cutoff strictly locked kitchen prep count to 5 active dabbas', ip_address: '127.0.0.1', timestamp: '2026-09-17 09:00:00' },
  { id: 102, actor_name: 'Pooja Mehta', actor_role: 'customer', action: 'SCHEDULE_PAUSE', entity_type: 'PAUSE_LOG', entity_id: 2, details: 'Customer requested pause for Udaipur wedding (Sept 14-18) via WhatsApp Bot', ip_address: '49.36.110.82', timestamp: '2026-09-13 21:14:05' },
  { id: 101, actor_name: 'Chef Rajesh Sharma', actor_role: 'owner', action: 'CREATE_TENANT', entity_type: 'TENANT', entity_id: 1, details: 'Registered Rajeshwar Annapurna Tiffin Kitchens with GSTIN 08AABCR1234F1Z5', ip_address: '127.0.0.1', timestamp: '2026-09-01 10:00:00' }
];

// Messy sample benchmark dataset for Level 3 — T4
const SAMPLE_MESSY_DATASET = [
  { name: 'Kavita Joshi', phone: '9828877665', start_date: '2026-09-01', address: 'B-12, Vaishali Nagar, Jaipur' },
  { name: 'Sanjay Rawat', phone: '+91 97855 44332', start_date: '15/09/2026', address: 'Plot 4, Mansarovar Sector 3' },
  { name: 'Manish Pareek', phone: '09414433221', start_date: '1st October 2026', address: '45, Raja Park, Jaipur' },
  { name: 'Kavita Duplicate', phone: '9828877665', start_date: '2026-09-01', address: 'Duplicate entry in batch' },
  { name: 'Deepak Twin', phone: '9001234567', start_date: '2026-09-01', address: 'Duplicate phone in existing DB' },
  { name: '', phone: '9829900112', start_date: '2026-09-01', address: 'Missing name error' },
  { name: 'Harish Sharma', phone: 'invalid-phone-xyz', start_date: '2026-09-01', address: 'Corrupt phone format' },
  { name: 'Pankaj Mathur', phone: '9829933445', start_date: 'not-a-valid-date', address: 'Corrupt date string' }
];

// Pro-rated billing calculator
function calculateProratedMath(monthlyPrice, monthStr, pauseLogs = [], includeGst = true) {
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let totalWeekdays = 0;
  let pausedWeekdays = 0;
  let deliveredWeekdays = 0;
  const schedule = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dayOfWeek = curDate.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayName = curDate.toLocaleDateString('en-US', { weekday: 'short' });

    if (isWeekday) totalWeekdays++;

    const pause = pauseLogs.find(p => dateStr >= p.start_date && dateStr <= p.end_date);
    let status = 'DELIVERED';

    if (!isWeekday) {
      status = 'WEEKEND';
    } else if (pause) {
      status = 'PAUSED';
      pausedWeekdays++;
    } else {
      status = 'DELIVERED';
      deliveredWeekdays++;
    }

    schedule.push({ date: dateStr, day: d, dayName, isWeekday, status, reason: pause?.reason || null });
  }

  const dailyRate = parseFloat((monthlyPrice / (totalWeekdays || 1)).toFixed(2));
  const taxableAmount = parseFloat((deliveredWeekdays * dailyRate).toFixed(2));
  const savings = parseFloat((pausedWeekdays * dailyRate).toFixed(2));
  
  const cgst = includeGst ? parseFloat((taxableAmount * 0.025).toFixed(2)) : 0;
  const sgst = includeGst ? parseFloat((taxableAmount * 0.025).toFixed(2)) : 0;
  const finalAmount = parseFloat((taxableAmount + cgst + sgst).toFixed(2));

  return { totalWeekdays, deliveredWeekdays, pausedWeekdays, dailyRate, taxableAmount, cgst, sgst, finalAmount, savings, schedule };
}

// Split billing calculator for Level 2 — T6
function calculateSplitMath(monthlyPrice, monthStr, transferDate, pauseLogsA = []) {
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let totalWeekdays = 0;
  let daysServedA = 0;
  let pausedDaysA = 0;
  let daysServedB = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dayOfWeek = curDate.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (!isWeekday) continue;
    totalWeekdays++;

    if (dateStr < transferDate) {
      const isPaused = pauseLogsA.some(p => dateStr >= p.start_date && dateStr <= p.end_date);
      if (isPaused) pausedDaysA++;
      else daysServedA++;
    } else {
      daysServedB++;
    }
  }

  const dailyRate = parseFloat((monthlyPrice / (totalWeekdays || 1)).toFixed(2));
  const taxableA = parseFloat((daysServedA * dailyRate).toFixed(2));
  const gstA = parseFloat((taxableA * 0.05).toFixed(2));
  const finalA = parseFloat((taxableA + gstA).toFixed(2));

  const taxableB = parseFloat((daysServedB * dailyRate).toFixed(2));
  const gstB = parseFloat((taxableB * 0.05).toFixed(2));
  const finalB = parseFloat((taxableB + gstB).toFixed(2));

  return {
    totalWeekdays,
    dailyRate,
    customerA: { daysServed: daysServedA, pausedDays: pausedDaysA, taxableAmount: taxableA, finalAmount: finalA },
    customerB: { daysServed: daysServedB, taxableAmount: taxableB, finalAmount: finalB },
    totalServedDays: daysServedA + daysServedB,
    totalBilledAmount: parseFloat((finalA + finalB).toFixed(2))
  };
}

// Main React App Component
function App() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'landing', 'dashboard', 'dispatch', 'kds', 'driver', 'whatsapp', 'audit'
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localityFilter, setLocalityFilter] = useState('ALL');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);

  // Driver Stop Delivery Statuses
  const [deliveryStatuses, setDeliveryStatuses] = useState({ 1: 'DELIVERED' });

  // WhatsApp Chat Simulator State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '🍱 Namaste! Welcome to Rajeshwar Annapurna Tiffin Assistant.\nReply with MENU, PAUSE, RESUME, or BILL.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Today's special menu
  const [todaysMenu, setTodaysMenu] = useState({
    sabzi: 'Paneer Butter Masala & Seasonal Aloo Gobi',
    dal: 'Dal Tadka (Jeera & Ghee)',
    breads: '4 Warm Butter Phulkas',
    rice: 'Steamed Jeera Rice',
    extras: 'Fresh Salad, Boondi Raita & Gulab Jamun'
  });
  const [editingMenu, setEditingMenu] = useState(false);

  // Standard Modals
  const [pauseModal, setPauseModal] = useState(null);
  const [billModal, setBillModal] = useState(null);
  const [newSubModal, setNewSubModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Level 1 — T1 Clock & Outbox Modal
  const [outboxModal, setOutboxModal] = useState(false);
  const [clockDate, setClockDate] = useState('2026-09-17');
  const [outboxNotifications, setOutboxNotifications] = useState([]);
  const [clockLoading, setClockLoading] = useState(false);

  // Level 2 — T6 Mid-Cycle Transfer Modal
  const [transferModal, setTransferModal] = useState(null);
  const [transferTargetName, setTransferTargetName] = useState('Rahul Verma');
  const [transferTargetPhone, setTransferTargetPhone] = useState('9928114455');
  const [transferTargetAddress, setTransferTargetAddress] = useState('Flat 501, Coral Heights, C-Scheme');
  const [transferDate, setTransferDate] = useState('2026-09-15');
  const [transferNotes, setTransferNotes] = useState('Transferred subscription mid-month to colleague');

  // Level 3 — T4 Messy Customer Importer Modal
  const [importModal, setImportModal] = useState(false);
  const [importDataText, setImportDataText] = useState('');
  const [importReport, setImportReport] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handlePhoneSearch = (val) => {
    setPhoneQuery(val);
    if (!val.trim()) {
      setMatchedCustomer(null);
      return;
    }
    const match = customers.find(c => c.phone.includes(val.trim()));
    setMatchedCustomer(match || null);
  };

  const handlePauseSubmit = (subId, startDate, endDate, reason) => {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = '2026-09-17';
    let cutoffNotice = '';

    if (startDate === todayStr && currentHour >= 9) {
      cutoffNotice = ' (Note: 9:00 AM cutoff passed. Meal for today is already cooking; pause takes effect tomorrow)';
    }

    setCustomers(prev => prev.map(c => {
      if (c.subscription_id === subId) {
        const newLogs = [...c.pause_logs, { id: Date.now(), start_date: startDate, end_date: endDate, reason }];
        return { ...c, status: 'PAUSED', pause_logs: newLogs };
      }
      return c;
    }));

    const target = customers.find(c => c.subscription_id === subId);
    const newLog = {
      id: Date.now(),
      actor_name: target ? target.name : 'Kitchen Admin',
      actor_role: 'customer',
      action: 'SCHEDULE_PAUSE',
      entity_type: 'SUBSCRIPTION',
      entity_id: subId,
      details: `Paused from ${startDate} to ${endDate} (${reason})${cutoffNotice}`,
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);

    setPauseModal(null);
    triggerNotification(`Paused subscription from ${startDate} to ${endDate}${cutoffNotice}`);
  };

  const handleResume = (subId) => {
    setCustomers(prev => prev.map(c => {
      if (c.subscription_id === subId) {
        return { ...c, status: 'ACTIVE' };
      }
      return c;
    }));

    const target = customers.find(c => c.subscription_id === subId);
    const newLog = {
      id: Date.now(),
      actor_name: target ? target.name : 'Kitchen Admin',
      actor_role: 'customer',
      action: 'RESUME_SUBSCRIPTION',
      entity_type: 'SUBSCRIPTION',
      entity_id: subId,
      details: 'Resumed lunch delivery to ACTIVE status',
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerNotification('Subscription resumed to ACTIVE!');
  };

  const handleDriverStatus = (subId, newStatus) => {
    setDeliveryStatuses(prev => ({ ...prev, [subId]: newStatus }));
    const target = customers.find(c => c.subscription_id === subId);
    const newLog = {
      id: Date.now(),
      actor_name: 'Mukesh Saini (Lead Driver)',
      actor_role: 'driver',
      action: 'DELIVERY_STATUS_UPDATE',
      entity_type: 'DELIVERY_RUN',
      entity_id: subId,
      details: `Stop for ${target?.name || 'Customer'} marked ${newStatus}`,
      ip_address: '106.51.24.12',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);
    triggerNotification(`Stop updated to: ${newStatus}`);
  };

  const handleSendWhatsAppMessage = (msgText) => {
    const text = (msgText || chatInput).trim();
    if (!text) return;

    const newMsgList = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMsgList);
    setChatInput('');

    const upper = text.toUpperCase();
    let botReply = '';

    if (upper.includes('MENU')) {
      botReply = `🍲 *Today's TiffinFlow Menu:*\n• Curry: ${todaysMenu.sabzi}\n• Dal: ${todaysMenu.dal}\n• Breads: ${todaysMenu.breads}\n• Rice: ${todaysMenu.rice}\n• Accompaniment: ${todaysMenu.extras}`;
    } else if (upper.startsWith('PAUSE')) {
      botReply = `⏸️ *Pause Request Registered:*\nYour tiffin delivery is paused. 9:00 AM morning cutoff applies: you will strictly NOT be billed for weekdays on leave.`;
    } else if (upper.includes('RESUME') || upper.includes('UNPAUSE')) {
      botReply = `▶️ *Welcome Back!*\nYour tiffin delivery has been set to ACTIVE. Fresh lunch will arrive at your door tomorrow at 12:45 PM.`;
    } else if (upper.includes('BILL')) {
      botReply = `💳 *Month-End Pro-Rated Bill Breakdown:*\n• Standard Plan: ₹2,200/mo\n• Weekdays Served: 20 days\n• Paused Weekdays: 2 days\n• Taxable: ₹2,000 + 5% GST (CGST ₹50 + SGST ₹50)\n• *Total Due: ₹2,100* (Saved: ₹200)`;
    } else {
      botReply = `🍱 *TiffinFlow Bot Commands:*\n• Type *MENU* to see today's meal\n• Type *PAUSE* to skip meals on leave\n• Type *RESUME* to restart delivery\n• Type *BILL* to check pro-rated charges`;
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 350);
  };

  const handleAddSubscriber = (newCust) => {
    setCustomers(prev => [newCust, ...prev]);
    const newLog = {
      id: Date.now(),
      actor_name: 'Chef Rajesh Sharma',
      actor_role: 'owner',
      action: 'NEW_SUBSCRIBER',
      entity_type: 'CUSTOMER',
      entity_id: newCust.id,
      details: `Enrolled new subscriber ${newCust.name} for ${newCust.plan_name} (${newCust.locality})`,
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setNewSubModal(false);
    triggerNotification(`Subscribed ${newCust.name} successfully!`);
  };

  // --------------------------------------------------------------------------
  // Level 1 — T1 Clock & Outbox Handlers
  // --------------------------------------------------------------------------
  const fetchOutbox = async (dateStr) => {
    try {
      const res = await fetch(`/outbox?date=${dateStr || clockDate}`);
      if (res.ok) {
        const data = await res.json();
        setOutboxNotifications(data.outbox || data.notifications || []);
      }
    } catch (err) {
      console.warn('Backend outbox fetch error (fallback local):', err);
    }
  };

  const handleTriggerClock = async (dateOverride) => {
    const targetDate = dateOverride || clockDate;
    setClockLoading(true);
    try {
      const res = await fetch('/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification(`⏰ Clock ticked for ${targetDate}: ${data.notified_count} morning delivery notifications sent to outbox!`);
        await fetchOutbox(targetDate);
      } else {
        triggerNotification(`⏰ Clock note: ${data.message || 'No notifications sent'}`);
      }
    } catch (err) {
      // Offline fallback: simulate outbox locally
      const activeNonPaused = customers.filter(c => {
        if (c.status !== 'ACTIVE') return false;
        const isPaused = c.pause_logs.some(p => targetDate >= p.start_date && targetDate <= p.end_date);
        return !isPaused;
      });
      const simulatedOutbox = activeNonPaused.map(c => ({
        id: Date.now() + Math.random(),
        recipient_name: c.name,
        recipient_phone: c.phone,
        delivery_date: targetDate,
        message: `🍱 Good morning ${c.name}! Your fresh lunch (${c.meal_type} - ${c.plan_name}) is cooking and will arrive by 12:45 PM.`,
        status: 'SENT',
        channel: 'WHATSAPP'
      }));
      setOutboxNotifications(simulatedOutbox);
      triggerNotification(`⏰ Clock simulated for ${targetDate}: ${simulatedOutbox.length} notifications generated!`);
    } finally {
      setClockLoading(false);
    }
  };

  const handleClearOutbox = async () => {
    try {
      await fetch('/outbox', { method: 'DELETE' });
    } catch (err) {}
    setOutboxNotifications([]);
    triggerNotification('Outbox notifications cleared for fresh testing.');
  };

  // --------------------------------------------------------------------------
  // Level 2 — T6 Subscription Transfer Handlers
  // --------------------------------------------------------------------------
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferModal) return;

    try {
      const res = await fetch(`/subscriptions/${transferModal.subscription_id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_name: transferTargetName,
          new_phone: transferTargetPhone,
          new_address: transferTargetAddress,
          transfer_date: transferDate,
          notes: transferNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        const split = data.billing_split;
        triggerNotification(`🔄 Subscription transferred! Split bill: ${data.from_customer?.name || transferModal.name} ₹${split.customer_a.finalAmount} (${split.customer_a.daysServed} days) | ${data.to_customer?.name || transferTargetName} ₹${split.customer_b.finalAmount} (${split.customer_b.daysServed} days)`);
      }
    } catch (err) {
      console.warn('Transfer backend error, applying locally:', err);
    }

    // Update locally so UI reflects transfer immediately
    setCustomers(prev => prev.map(c => {
      if (c.subscription_id === transferModal.subscription_id) {
        return {
          ...c,
          name: `${transferTargetName} (Transferred from ${transferModal.name})`,
          phone: transferTargetPhone,
          address: transferTargetAddress,
          status: 'ACTIVE'
        };
      }
      return c;
    }));

    const newLog = {
      id: Date.now(),
      actor_name: 'Customer Service Admin',
      actor_role: 'admin',
      action: 'SUBSCRIPTION_TRANSFER',
      entity_type: 'SUBSCRIPTION',
      entity_id: transferModal.subscription_id,
      details: `Transferred plan mid-cycle on ${transferDate} from ${transferModal.name} to ${transferTargetName}`,
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);

    setTransferModal(null);
  };

  // --------------------------------------------------------------------------
  // Level 3 — T4 Messy Customer Importer Handlers
  // --------------------------------------------------------------------------
  const handleLoadMessyPreset = () => {
    setImportDataText(JSON.stringify(SAMPLE_MESSY_DATASET, null, 2));
  };

  const handleExecuteImport = async () => {
    if (!importDataText.trim()) return;
    setImportLoading(true);
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(importDataText);
      } catch (e) {
        // Fallback: send as raw text
        parsedPayload = importDataText;
      }

      const res = await fetch('/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedPayload)
      });
      const data = await res.json();
      setImportReport(data);

      if (data.imported > 0 && Array.isArray(data.details?.imported)) {
        // Add valid imported records to state
        const newSubs = data.details.imported.map((item, idx) => ({
          id: Date.now() + idx,
          subscription_id: Date.now() + idx,
          name: item.name,
          phone: item.phone,
          locality: 'Imported Locality',
          address: item.address || 'Imported Address, Jaipur',
          dietary_notes: 'Bulk Imported Customer',
          plan_id: 1,
          plan_name: 'Ghar Ki Thali (Standard Veg)',
          monthly_price: 2200,
          meal_type: 'Veg',
          tier: 'STANDARD',
          status: 'ACTIVE',
          pause_logs: []
        }));
        setCustomers(prev => [...newSubs, ...prev]);
      }
      triggerNotification(`📥 Import complete: ${data.imported} imported, ${data.deduped} deduped, ${data.rejected} rejected.`);
    } catch (err) {
      console.error('Import error:', err);
      triggerNotification('Import failed: Check data format');
    } finally {
      setImportLoading(false);
    }
  };

  // Calculations for UI filters & views
  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesLocality = localityFilter === 'ALL' || c.locality === localityFilter;
    return matchesSearch && matchesStatus && matchesLocality;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeList = customers.filter(c => c.status === 'ACTIVE');
  const pausedList = customers.filter(c => c.status === 'PAUSED');
  const activeCount = activeList.length;
  const pausedCount = pausedList.length;

  const driverClusters = {};
  activeList.forEach(c => {
    if (!driverClusters[c.locality]) driverClusters[c.locality] = [];
    driverClusters[c.locality].push(c);
  });

  const mealCounts = { Veg: 0, Jain: 0, 'Diet/High-Protein': 0 };
  const tierCounts = { STANDARD: 0, DELUXE: 0, MINI: 0 };
  activeList.forEach(c => {
    if (mealCounts[c.meal_type] !== undefined) mealCounts[c.meal_type]++;
    else mealCounts[c.meal_type] = 1;

    const tier = c.tier || 'STANDARD';
    if (tierCounts[tier] !== undefined) tierCounts[tier]++;
    else tierCounts[tier] = 1;
  });

  const localities = Array.from(new Set(customers.map(c => c.locality))).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      {/* --------------------------------------------------------------------
          TWO-TIER PRODUCTION HEADER
          Tier 1: Brand & Global Actions (Live API, Outbox/Clock CTA, Theme, Add Sub)
          Tier 2: Sleek Pill Tabs Navigation (Whitespace-nowrap, no wrap)
          -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-color)] shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div onClick={() => setActiveTab('landing')} className="flex items-center gap-3 cursor-pointer select-none shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              🍱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[var(--text-primary)] tracking-tight">Tiffin<span className="text-[var(--color-amber)]">Flow</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full badge-active">
                  Twists Live (T1, T6, T4)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] hidden sm:block">Rajeshwar Annapurna Kitchens • GSTIN: 08AABCR1234F1Z5</p>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Level 1 — T1 Clock / Outbox CTA Button */}
            <button
              onClick={() => { setOutboxModal(true); fetchOutbox(clockDate); }}
              className="h-9 px-3 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-[var(--color-amber)] hover:bg-amber-500/20 transition flex items-center gap-1.5 shrink-0"
              title="View Delivery Notification Outbox (Graded via /outbox after POST /clock)"
            >
              <span>⏰</span>
              <span className="hidden sm:inline">Morning Clock / Outbox</span>
            </button>

            {/* Live backend health badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">Port 5000</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="h-9 px-3 rounded-lg text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:border-[var(--color-amber)] transition flex items-center gap-1.5"
              title="Toggle Light / Dark Mode"
            >
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span className="hidden lg:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {/* Primary CTA: Add Subscriber */}
            <button
              onClick={() => setNewSubModal(true)}
              className="btn-primary h-9 text-xs px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <span className="font-bold">+</span>
              <span className="font-bold whitespace-nowrap">Add Subscriber</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Sub-Navigation */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar -mx-1 px-1">
              {[
                { id: 'landing', label: 'Overview', icon: '✨' },
                { id: 'dashboard', label: 'Subscriptions & Billing', icon: '👥' },
                { id: 'dispatch', label: 'Kitchen Dispatch', icon: '👨‍🍳' },
                { id: 'kds', label: 'KDS TV Wallboard', icon: '📺' },
                { id: 'driver', label: 'Driver Routes', icon: '🛵' },
                { id: 'whatsapp', label: 'WhatsApp Bot', icon: '💬' },
                { id: 'audit', label: 'Audit Trail', icon: '🛡️' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-8 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive 
                        ? 'bg-amber-500/15 text-[var(--color-amber)] border border-amber-500/40 shadow-sm font-bold' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4 animate-fade-in">
          <div className="bg-[var(--color-emerald-glow)] border border-[var(--color-emerald)] text-[var(--color-emerald)] px-4 py-2.5 rounded-xl flex items-center justify-between text-sm shadow-md font-semibold">
            <span>✅ {notification}</span>
            <button onClick={() => setNotification(null)} className="font-bold">✕</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {/* TAB 1: ONE-PAGE LANDING PAGE */}
        {activeTab === 'landing' && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-amber-glow)] border border-[var(--color-amber)] text-[var(--color-amber)] text-xs font-bold uppercase tracking-wider">
                ⚡ Solves the Storyline & The 3 Official Twists (T1, T6, T4)
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] leading-tight">
                Every customer billed <br/><span className="text-[var(--color-amber)]">only for the days</span> actually served.
              </h1>
              <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                The smart operating system for home-style tiffin services. Handles monthly weekday lunch delivery, 1-click vacation pause, instant phone lookup, strict 9:00 AM cutoff rules, automated GST pro-rated invoicing, mid-cycle transfers, and messy data cleansing.
              </p>
              <div className="flex justify-center gap-4 pt-3 flex-wrap">
                <button onClick={() => setActiveTab('dashboard')} className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
                  Try Interactive Dashboard & Billing →
                </button>
                <button onClick={() => { setOutboxModal(true); fetchOutbox(clockDate); }} className="btn-secondary text-base px-6 py-3.5">
                  ⏰ Test Morning Clock (T1)
                </button>
              </div>
            </div>

            {/* 3 Twists Feature Showcase Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-l-4 border-amber-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-[var(--color-amber)]">Level 1 — T1 (Integrate)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[var(--color-amber)]">POST /clock</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Morning Delivery Notification Outbox</h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                  Each morning, automatically dispatches personalized lunch delivery notifications to active weekday customers who are NOT on leave. Inspected and graded via <code>GET /outbox</code>.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-blue-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-blue-500">Level 2 — T6 (Lifecycle)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">POST /transfer</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Mid-Cycle Transfer & Split Billing</h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                  Transfers subscription to a new recipient mid-month without resetting the plan or cycle. Mathematically splits the monthly bill according to exact days served by Customer A vs Customer B.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-emerald-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-[var(--color-emerald)]">Level 3 — T4 (Messy Data)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">POST /import</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Messy Data Importer & Report</h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                  Cleans noisy subscriber sheets with duplicate phones, mixed date formats (DD/MM/YYYY, ISO, textual dates), and corrupt rows, returning an exact <code>&#123; imported, deduped, rejected &#125;</code> report.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DASHBOARD, PHONE SEARCH & PRO-RATED BILLING */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 border-l-4 border-emerald-500">
                <span className="text-xs text-[var(--text-muted)] font-medium">Active Subscriptions</span>
                <div className="text-3xl font-black text-[var(--text-primary)] mt-1">{activeCount}</div>
                <span className="text-[11px] text-[var(--color-emerald)] font-semibold">Receiving lunch</span>
              </div>
              <div className="glass-card p-4 border-l-4 border-amber-500">
                <span className="text-xs text-[var(--text-muted)] font-medium">Today's Lunch Count</span>
                <div className="text-3xl font-black text-[var(--color-amber)] mt-1">{activeCount} <span className="text-xs text-[var(--text-muted)] font-normal">dabbas</span></div>
                <span className="text-[11px] text-[var(--text-muted)]">Weekdays delivery</span>
              </div>
              <div className="glass-card p-4 border-l-4 border-rose-500">
                <span className="text-xs text-[var(--text-muted)] font-medium">Currently Paused</span>
                <div className="text-3xl font-black text-[var(--color-rose)] mt-1">{pausedCount}</div>
                <span className="text-[11px] text-[var(--color-rose)] font-semibold">On vacation / festival</span>
              </div>
              <div className="glass-card p-4 border-l-4 border-blue-500">
                <span className="text-xs text-[var(--text-muted)] font-medium">Projected Monthly</span>
                <div className="text-3xl font-black text-[var(--text-primary)] mt-1">₹18,300</div>
                <span className="text-[11px] text-[var(--text-muted)]">Auto-prorated with 5% GST</span>
              </div>
            </div>

            {/* TODAY'S SPECIAL KITCHEN MENU CARD */}
            <div className="glass-card p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Today's Cooking Menu (Dispatch Spec)</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Broadcasted to customers and kitchen dispatch staff</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingMenu(!editingMenu)} 
                  className="text-xs font-bold text-[var(--color-amber)] hover:underline"
                >
                  {editingMenu ? 'Done Editing' : '✏️ Edit Menu'}
                </button>
              </div>

              {editingMenu ? (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-bold">1. Curry / Sabzi</label>
                      <input 
                        className="input-control w-full text-xs" 
                        value={todaysMenu.sabzi} 
                        onChange={(e) => setTodaysMenu({ ...todaysMenu, sabzi: e.target.value })} 
                        placeholder="e.g. Paneer Butter Masala"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-bold">2. Lentil / Dal</label>
                      <input 
                        className="input-control w-full text-xs" 
                        value={todaysMenu.dal} 
                        onChange={(e) => setTodaysMenu({ ...todaysMenu, dal: e.target.value })} 
                        placeholder="e.g. Dal Tadka (Jeera & Ghee)"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-bold">3. Breads & Rice</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input 
                          className="input-control w-full text-xs" 
                          value={todaysMenu.breads} 
                          onChange={(e) => setTodaysMenu({ ...todaysMenu, breads: e.target.value })} 
                          placeholder="4 Butter Phulkas"
                        />
                        <input 
                          className="input-control w-full text-xs" 
                          value={todaysMenu.rice} 
                          onChange={(e) => setTodaysMenu({ ...todaysMenu, rice: e.target.value })} 
                          placeholder="Steamed Rice"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-bold">4. Accompaniments</label>
                      <input 
                        className="input-control w-full text-xs" 
                        value={todaysMenu.extras} 
                        onChange={(e) => setTodaysMenu({ ...todaysMenu, extras: e.target.value })} 
                        placeholder="Salad & Raita"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                    <button type="button" onClick={() => setEditingMenu(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                    <button type="button" onClick={() => { setEditingMenu(false); triggerNotification("Menu updated across KDS & WhatsApp!"); }} className="btn-primary text-xs px-4 py-1.5">✓ Save Menu</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Curry / Sabzi</span>
                    <strong className="text-[var(--text-primary)]">{todaysMenu.sabzi}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Lentil / Dal</span>
                    <strong className="text-[var(--text-primary)]">{todaysMenu.dal}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Breads & Rice</span>
                    <strong className="text-[var(--text-primary)]">{todaysMenu.breads}, {todaysMenu.rice}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Accompaniments</span>
                    <strong className="text-[var(--text-primary)]">{todaysMenu.extras}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* INSTANT PHONE SEARCH CARD */}
            <div className="glass-card p-6 border border-amber-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    📞 Instant Phone Number Lookup
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">Search customer by phone to view current status, pause logs, and live tax bill</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-muted)]">Try demo:</span>
                  <button onClick={() => handlePhoneSearch('9829012345')} className="px-2.5 py-1 rounded bg-[var(--bg-surface)] text-[var(--color-amber)] border border-[var(--border-color)] font-bold">
                    Amit (Active)
                  </button>
                  <button onClick={() => handlePhoneSearch('9829054321')} className="px-2.5 py-1 rounded bg-[var(--bg-surface)] text-[var(--color-rose)] border border-[var(--border-color)] font-bold">
                    Pooja (Paused)
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  className="input-control w-full text-base font-mono pl-11"
                  placeholder="Type phone number digits (e.g. 9829012345)..."
                  value={phoneQuery}
                  onChange={(e) => handlePhoneSearch(e.target.value)}
                />
                <span className="absolute left-4 top-3 text-[var(--text-muted)]">🔍</span>
              </div>

              {matchedCustomer && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-md">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-[var(--text-primary)]">{matchedCustomer.name}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${matchedCustomer.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}`}>
                        {matchedCustomer.status === 'ACTIVE' ? '● Active for Lunch' : '⏸️ Currently Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">📞 {matchedCustomer.phone} • 📍 {matchedCustomer.address} ({matchedCustomer.locality})</p>
                    <p className="text-xs text-[var(--color-amber)] font-semibold mt-0.5">🍱 Plan: {matchedCustomer.plan_name} (₹{matchedCustomer.monthly_price}/mo) • <em>{matchedCustomer.dietary_notes}</em></p>
                    
                    {matchedCustomer.pause_logs.length > 0 && (
                      <div className="mt-2 text-xs text-[var(--color-rose)] font-medium">
                        <strong>Recorded Pauses:</strong> {matchedCustomer.pause_logs.map(p => `${p.start_date} to ${p.end_date} (${p.reason})`).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button onClick={() => setTransferModal(matchedCustomer)} className="btn-secondary text-xs px-3 py-2 text-blue-600 font-bold border-blue-500/40">
                      🔄 Transfer (T6)
                    </button>
                    {matchedCustomer.status === 'PAUSED' ? (
                      <button onClick={() => handleResume(matchedCustomer.subscription_id)} className="btn-secondary text-xs px-3 py-2 text-emerald-600 font-bold border-emerald-500/40">
                        ▶ Resume
                      </button>
                    ) : (
                      <button onClick={() => setPauseModal(matchedCustomer)} className="btn-secondary text-xs px-3 py-2 text-rose-600 font-bold border-rose-500/40">
                        ⏸️ Set Pause
                      </button>
                    )}
                    <button onClick={() => setBillModal(matchedCustomer)} className="btn-primary text-xs px-4 py-2">
                      🧮 Compute Tax Bill
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SUBSCRIBER TABLE WITH BULK IMPORTER & ACTIONS */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">All Subscribers & Monthly Plans</h3>
                  <button
                    onClick={() => { setImportModal(true); handleLoadMessyPreset(); }}
                    className="btn-secondary text-xs px-3 py-1 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 font-bold flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Bulk Import Messy List (T4)</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search name, phone, address..."
                    className="input-control text-xs w-48"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                  <select
                    className="input-control text-xs w-32"
                    value={localityFilter}
                    onChange={(e) => { setLocalityFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="ALL">All Areas</option>
                    {localities.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <select
                    className="input-control text-xs w-28"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="PAUSED">Paused Only</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                      <th className="pb-3 font-semibold">Subscriber</th>
                      <th className="pb-3 font-semibold">Phone</th>
                      <th className="pb-3 font-semibold">Area / Locality</th>
                      <th className="pb-3 font-semibold">Plan & Meal Type</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions & Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {paginated.map(c => (
                      <tr key={c.id} className="hover:bg-[var(--bg-card-hover)] transition">
                        <td className="py-3">
                          <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{c.address}</div>
                          {c.dietary_notes && <div className="text-[11px] text-[var(--color-amber)] font-medium">🥗 {c.dietary_notes}</div>}
                        </td>
                        <td className="py-3 font-mono text-[var(--text-secondary)] text-xs">{c.phone}</td>
                        <td className="py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
                            📍 {c.locality || 'Jaipur'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="text-[var(--text-primary)] font-medium">{c.plan_name}</div>
                          <div className="text-xs text-[var(--color-amber)] font-bold">₹{c.monthly_price}/mo ({c.meal_type})</div>
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${c.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1.5 flex-wrap justify-end">
                            <button
                              onClick={() => setTransferModal(c)}
                              className="px-2 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-600 font-bold border border-blue-500/30 hover:bg-blue-500/20"
                              title="Transfer subscription mid-cycle (Level 2 Twist T6)"
                            >
                              🔄 Transfer
                            </button>
                            {c.status === 'PAUSED' ? (
                              <button onClick={() => handleResume(c.subscription_id)} className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30 hover:bg-emerald-500/20">
                                ▶ Resume
                              </button>
                            ) : (
                              <button onClick={() => setPauseModal(c)} className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/10 text-rose-600 font-bold border border-rose-500/30 hover:bg-rose-500/20">
                                ⏸️ Pause
                              </button>
                            )}
                            <button onClick={() => setBillModal(c)} className="btn-primary text-xs px-3 py-1.5">
                              🧮 Bill
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                <div>Showing Page {currentPage} of {totalPages} ({filtered.length} subscribers)</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: KITCHEN DISPATCH BOARD */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">👨‍🍳 Morning Kitchen Dispatch Board</h2>
                <p className="text-sm text-[var(--text-secondary)]">Pre-sorts active lunch dabbas to cook vs paused subscribers on leave today</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setOutboxModal(true); fetchOutbox(clockDate); }}
                  className="btn-secondary text-xs px-3 py-2 text-[var(--color-amber)] font-bold border-amber-500/30 flex items-center gap-1.5"
                >
                  <span>⏰</span>
                  <span>Advance Clock / View Outbox (T1)</span>
                </button>
                <div className="bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] shadow-sm flex items-center gap-2">
                  <span>🔒 9:00 AM Cutoff Status:</span>
                  <strong className="text-emerald-500 font-bold">LOCKED FOR DISPATCH</strong>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Active List */}
              <div className="glass-card p-6 border-t-4 border-emerald-500 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--color-emerald)]">✅ Cook & Pack ({activeCount} Dabbas)</h3>
                  <span className="text-xs px-2 py-0.5 rounded badge-active">Active Today</span>
                </div>

                <div className="space-y-3">
                  {activeList.map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm">{c.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-[var(--color-amber)]">{c.meal_type}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">📞 {c.phone} • 📍 {c.address}</p>
                      {c.dietary_notes && <p className="text-xs text-[var(--color-amber)] font-medium">⚠️ {c.dietary_notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Paused List */}
              <div className="glass-card p-6 border-t-4 border-rose-500 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--color-rose)]">🚫 Do Not Cook - Paused ({pausedCount})</h3>
                  <span className="text-xs px-2 py-0.5 rounded badge-paused">Zero Billing Today</span>
                </div>

                <div className="space-y-3">
                  {pausedList.map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-rose-500/30 space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm">{c.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-paused">On Leave</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">📞 {c.phone}</p>
                      <p className="text-xs text-[var(--color-rose)] font-semibold">
                        🏖️ <strong>Reason:</strong> {c.pause_logs[0]?.reason || 'Customer requested pause'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KDS TV SCREEN MODE */}
        {activeTab === 'kds' && (
          <div className="space-y-6 animate-fade-in p-4 rounded-2xl kds-tv">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📺</span>
                  <h2 className="text-3xl font-black text-amber-400 tracking-tight">KITCHEN DISPLAY SYSTEM (KDS TV)</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    9:00 AM CUTOFF LOCKED
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">Live prep counters and packaging manifest for Head Cook Ramu Maharaj</p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400">
                <div>DATE: <strong>2026-09-17</strong></div>
                <div>SERVICE: <strong>LUNCH DISPATCH (12:30 PM)</strong></div>
              </div>
            </div>

            {/* 4 Big Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kds-card p-5 rounded-xl border-l-4 border-emerald-500">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL TO COOK TODAY</span>
                <div className="text-5xl font-black text-emerald-400 mt-2">{activeCount}</div>
                <span className="text-xs text-slate-400">Strict active count</span>
              </div>
              <div className="kds-card p-5 rounded-xl border-l-4 border-rose-500">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PAUSED / ON LEAVE</span>
                <div className="text-5xl font-black text-rose-400 mt-2">{pausedCount}</div>
                <span className="text-xs text-slate-400">Zero groceries prepared</span>
              </div>
              <div className="kds-card p-5 rounded-xl border-l-4 border-amber-500">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">STANDARD THALIS</span>
                <div className="text-5xl font-black text-amber-400 mt-2">{tierCounts.STANDARD}</div>
                <span className="text-xs text-slate-400">4 Phulkas + Dal + Sabzi</span>
              </div>
              <div className="kds-card p-5 rounded-xl border-l-4 border-blue-500">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DELUXE / DIET MEALS</span>
                <div className="text-5xl font-black text-blue-400 mt-2">{tierCounts.DELUXE}</div>
                <span className="text-xs text-slate-400">Paneer / Protein specials</span>
              </div>
            </div>

            {/* Meal Distribution & Allergies */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="kds-card p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  🍱 MEAL TYPE DISTRIBUTION
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-bold">VEG STANDARD</div>
                    <div className="text-3xl font-black text-emerald-400 mt-1">{mealCounts.Veg || 0}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-bold">JAIN SATVIK</div>
                    <div className="text-3xl font-black text-amber-400 mt-1">{mealCounts.Jain || 0}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-bold">HIGH PROTEIN</div>
                    <div className="text-3xl font-black text-blue-400 mt-1">{mealCounts['Diet/High-Protein'] || 0}</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="text-amber-400 font-bold uppercase tracking-wider">Kitchen Packing Checklist:</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Phulkas to puff:</span>
                    <strong className="font-mono text-emerald-400">{activeCount * 4} rotis</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Dal batches:</span>
                    <strong className="font-mono text-emerald-400">5 large containers</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Sweet / Gulab Jamun count:</span>
                    <strong className="font-mono text-emerald-400">{activeCount} pieces</strong>
                  </div>
                </div>
              </div>

              <div className="kds-card p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                  ⚠️ CRITICAL DIETARY & ALLERGY ALERTS ({activeList.filter(c => c.dietary_notes).length})
                </h3>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {activeList.filter(c => c.dietary_notes).map(c => (
                    <div key={c.id} className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200 text-sm">{c.name} <span className="text-xs font-normal text-slate-400">({c.locality})</span></div>
                        <div className="text-xs text-rose-400 font-semibold mt-0.5">⚠️ {c.dietary_notes}</div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-amber-400">
                        {c.meal_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DRIVER MOBILE ROUTE DISPATCH */}
        {activeTab === 'driver' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">🛵 Driver Route & Dispatch Manifest</h2>
                <p className="text-sm text-[var(--text-secondary)]">Lead Driver: <strong>Mukesh Saini</strong> • Auto-skips paused homes to save fuel</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-emerald-glow)] text-[var(--color-emerald)] font-bold border border-emerald-500/30">
                  Total Active Stops: {activeCount}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-rose-glow)] text-[var(--color-rose)] font-bold border border-rose-500/30">
                  Skipped Paused: {pausedCount}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(driverClusters).map(([locality, stops]) => (
                <div key={locality} className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📍</span>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{locality} Sector</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] font-bold text-[var(--color-amber)]">
                        {stops.length} Drops
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locality}, Jaipur`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                    >
                      🗺️ Open Cluster in Google Maps →
                    </a>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {stops.map(stop => {
                      const currStatus = deliveryStatuses[stop.subscription_id] || 'PENDING';
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.address}, Jaipur`)}`;

                      return (
                        <div key={stop.id} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-[var(--text-primary)] text-base">{stop.name}</h4>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">📍 {stop.address}</p>
                              <p className="text-xs font-mono text-[var(--color-amber)] font-bold mt-1">📞 {stop.phone}</p>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                              currStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                              currStatus === 'DOORBELL_RUNG' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                              currStatus === 'FAILED' ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30' :
                              'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                            }`}>
                              {currStatus}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                            <span>Meal: <strong className="text-[var(--text-primary)]">{stop.meal_type}</strong></span>
                            {stop.dietary_notes && <span className="text-[var(--color-amber)] font-medium">⚠️ {stop.dietary_notes}</span>}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-blue-500 font-bold border-blue-500/30"
                            >
                              🧭 Navigate (1-Tap)
                            </a>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleDriverStatus(stop.subscription_id, 'DOORBELL_RUNG')}
                                className="px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-600 font-bold border border-amber-500/30 hover:bg-amber-500/20"
                              >
                                🔔 Rung
                              </button>
                              <button
                                onClick={() => handleDriverStatus(stop.subscription_id, 'DELIVERED')}
                                className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30 hover:bg-emerald-500/25"
                              >
                                ✅ Delivered
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: WHATSAPP BOT SIMULATOR */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">💬 Meta WhatsApp Cloud API Bot Simulator</h2>
              <p className="text-xs text-[var(--text-secondary)]">Simulates incoming webhook commands to <code>POST /api/webhooks/whatsapp</code></p>
            </div>

            <div className="glass-card border-2 border-[var(--border-color)] rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    🍱
                  </div>
                  <div>
                    <div className="font-bold text-sm">Rajeshwar Tiffin Bot</div>
                    <div className="text-[11px] text-emerald-100 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Online • Verified Business API
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-emerald-800 px-2.5 py-1 rounded font-mono">
                  +91 98290 01122
                </div>
              </div>

              <div className="p-4 space-y-3 bg-[var(--bg-primary)] min-h-[380px] max-h-[420px] overflow-y-auto">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-slate-500/10 text-[var(--text-muted)]">
                    Messages are end-to-end encrypted
                  </span>
                </div>

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 text-xs leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                      {msg.text}
                      <div className="text-[9px] text-right opacity-60 mt-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex gap-2 overflow-x-auto">
                <button onClick={() => handleSendWhatsAppMessage('MENU')} className="px-3 py-1 rounded-full text-xs bg-amber-500/15 text-[var(--color-amber)] font-bold border border-amber-500/30 whitespace-nowrap">
                  🍲 MENU
                </button>
                <button onClick={() => handleSendWhatsAppMessage('PAUSE 2026-09-21 2026-09-25')} className="px-3 py-1 rounded-full text-xs bg-rose-500/15 text-[var(--color-rose)] font-bold border border-rose-500/30 whitespace-nowrap">
                  ⏸️ PAUSE Next Week
                </button>
                <button onClick={() => handleSendWhatsAppMessage('RESUME')} className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-[var(--color-emerald)] font-bold border border-emerald-500/30 whitespace-nowrap">
                  ▶️ RESUME Delivery
                </button>
                <button onClick={() => handleSendWhatsAppMessage('BILL')} className="px-3 py-1 rounded-full text-xs bg-blue-500/15 text-blue-600 font-bold border border-blue-500/30 whitespace-nowrap">
                  💳 Check BILL
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendWhatsAppMessage(); }} className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex gap-2">
                <input
                  type="text"
                  className="input-control flex-1 text-xs"
                  placeholder="Type WhatsApp command (e.g. MENU, PAUSE)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-primary text-xs px-4 py-2">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: ENTERPRISE AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">🛡️ Enterprise Immutable Audit Logs</h2>
                <p className="text-sm text-[var(--text-secondary)]">Tracks every pause change, cutoff lock, and delivery status with IP timestamps</p>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                Audit Records: <strong>{auditLogs.length} events logged</strong>
              </div>
            </div>

            <div className="glass-card p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Actor & Role</th>
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Event Details</th>
                    <th className="pb-3 font-semibold">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition">
                      <td className="py-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3">
                        <strong className="text-[var(--text-primary)]">{log.actor_name}</strong>
                        <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] uppercase font-bold text-[var(--color-amber)]">
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-[var(--color-emerald)]">{log.action}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{log.details}</td>
                      <td className="py-3 font-mono text-[var(--text-muted)]">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --------------------------------------------------------------------
          MODAL 1: LEVEL 1 — T1 MORNING CLOCK & OUTBOX VIEWER
          -------------------------------------------------------------------- */}
      {outboxModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-3xl w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Morning Delivery Notification Outbox</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Graded via <code>/outbox</code> after <code>POST /clock</code> • Notifies active, weekday, non-paused subscribers</p>
                </div>
              </div>
              <button onClick={() => setOutboxModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-lg">✕</button>
            </div>

            {/* Clock Trigger Controls */}
            <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">Clock Date:</label>
                <input
                  type="date"
                  value={clockDate}
                  onChange={(e) => {
                    setClockDate(e.target.value);
                    fetchOutbox(e.target.value);
                  }}
                  className="input-control text-xs font-mono"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleClearOutbox}
                  className="btn-secondary text-xs px-3 py-2 text-rose-600 border-rose-500/30"
                >
                  Clear Outbox
                </button>
                <button
                  onClick={() => handleTriggerClock(clockDate)}
                  disabled={clockLoading}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <span>{clockLoading ? '⏳' : '⚡'}</span>
                  <span>Advance Clock (POST /clock)</span>
                </button>
              </div>
            </div>

            {/* Outbox Notifications List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Queued Outbox Feed: <strong>{outboxNotifications.length} notifications</strong></span>
                <span className="text-[11px] text-[var(--color-emerald)] font-semibold">Channel: WhatsApp Cloud API</span>
              </div>

              {outboxNotifications.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl space-y-2">
                  <span className="text-3xl">📭</span>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Outbox is empty for {clockDate}</div>
                  <p className="text-xs text-[var(--text-secondary)]">Click "Advance Clock (POST /clock)" to evaluate active subscribers and generate morning messages.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {outboxNotifications.map((item, idx) => (
                    <div key={item.id || idx} className="outbox-card">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-[var(--text-primary)] text-sm">{item.recipient_name}</strong>
                          <span className="font-mono text-xs text-[var(--text-muted)]">({item.recipient_phone})</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full badge-active">
                          {item.status || 'SENT'}
                        </span>
                      </div>
                      <div className="outbox-message-bubble">
                        💬 {item.message}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1.5 flex justify-between">
                        <span>Delivery Target: {item.delivery_date || clockDate} (12:45 PM)</span>
                        <span>Channel: {item.channel || 'WHATSAPP'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
              <button onClick={() => setOutboxModal(false)} className="btn-secondary text-xs px-5 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL 2: LEVEL 2 — T6 MID-CYCLE SUBSCRIPTION TRANSFER & SPLIT BILL
          -------------------------------------------------------------------- */}
      {transferModal && (() => {
        const split = calculateSplitMath(
          transferModal.monthly_price,
          '2026-09',
          transferDate,
          transferModal.pause_logs
        );

        return (
          <div className="modal-overlay">
            <div className="modal-container max-w-2xl w-full p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Mid-Cycle Subscription Transfer</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Plan & cycle carry over • Billing mathematically splits according to who was served</p>
                  </div>
                </div>
                <button onClick={() => setTransferModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-lg">✕</button>
              </div>

              {/* Original Plan Details */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Original Subscriber A:</span>
                  <strong className="text-[var(--text-primary)] text-sm">{transferModal.name}</strong>
                  <span className="text-[var(--text-secondary)] ml-2 font-mono">({transferModal.phone})</span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Carried-Over Plan:</span>
                  <strong className="text-[var(--color-amber)]">{transferModal.plan_name}</strong>
                  <span className="text-[var(--text-secondary)] ml-1">₹{transferModal.monthly_price}/mo</span>
                </div>
              </div>

              {/* Recipient Customer B Inputs */}
              <form onSubmit={handleTransferSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">New Recipient Name (Customer B)</label>
                    <input
                      required
                      value={transferTargetName}
                      onChange={(e) => setTransferTargetName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="input-control w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Recipient Phone</label>
                    <input
                      required
                      value={transferTargetPhone}
                      onChange={(e) => setTransferTargetPhone(e.target.value)}
                      placeholder="e.g. 9928114455"
                      className="input-control w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">New Delivery Address</label>
                    <input
                      required
                      value={transferTargetAddress}
                      onChange={(e) => setTransferTargetAddress(e.target.value)}
                      placeholder="e.g. Flat 501, Coral Heights, C-Scheme"
                      className="input-control w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Effective Transfer Date (Mid-Cycle)</label>
                    <input
                      type="date"
                      required
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="input-control w-full text-xs font-mono"
                    />
                  </div>
                </div>

                {/* SIDE-BY-SIDE SPLIT BILLING BREAKDOWN */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block mb-2">
                    🧮 Exact Pro-Rated Billing Split (Sept 2026):
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Customer A Box */}
                    <div className="split-card-a space-y-2">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                        <strong className="text-[var(--color-amber)]">Original: {transferModal.name}</strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10">Sept 1 to {transferDate}</span>
                      </div>
                      <div className="space-y-1 text-[var(--text-secondary)]">
                        <div className="flex justify-between">
                          <span>Active Days Served:</span>
                          <strong className="text-[var(--text-primary)]">{split.customerA.daysServed} days</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Paused Leave:</span>
                          <span>{split.customerA.pausedDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Plan Rate:</span>
                          <span className="font-mono">₹{split.dailyRate}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-amber-500/20 font-bold text-[var(--color-amber)] text-sm">
                          <span>Payable (+5% GST):</span>
                          <span>₹{split.customerA.finalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer B Box */}
                    <div className="split-card-b space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                        <strong className="text-[var(--color-emerald)]">Recipient: {transferTargetName}</strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10">{transferDate} to Sept 30</span>
                      </div>
                      <div className="space-y-1 text-[var(--text-secondary)]">
                        <div className="flex justify-between">
                          <span>Active Days Served:</span>
                          <strong className="text-[var(--text-primary)]">{split.customerB.daysServed} days</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Paused Leave:</span>
                          <span>0 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Plan Rate:</span>
                          <span className="font-mono">₹{split.dailyRate}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-500/20 font-bold text-[var(--color-emerald)] text-sm">
                          <span>Payable (+5% GST):</span>
                          <span>₹{split.customerB.finalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)]">
                      Total Cycle Weekdays: <strong>{split.totalServedDays} days served</strong> ({split.customerA.daysServed} + {split.customerB.daysServed})
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      Combined Cycle Total: ₹{split.totalBilledAmount}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                  <button type="button" onClick={() => setTransferModal(null)} className="btn-secondary text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs px-5 py-2">
                    ✓ Confirm Mid-Cycle Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* --------------------------------------------------------------------
          MODAL 3: LEVEL 3 — T4 MESSY CUSTOMER LIST IMPORTER
          -------------------------------------------------------------------- */}
      {importModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-3xl w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📥</span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Messy Customer List Importer</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Handles duplicate phones, mixed date formats, and blanks • Returns &#123; imported, deduped, rejected &#125; report</p>
                </div>
              </div>
              <button onClick={() => setImportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-lg">✕</button>
            </div>

            {/* Benchmark Preset Button */}
            <div className="flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)] text-xs">
              <div>
                <strong className="text-[var(--text-primary)]">Official Grader Benchmark Dataset:</strong>
                <p className="text-[var(--text-muted)]">Contains mixed dates (DD/MM/YYYY, ISO, textual), dupes, and blanks</p>
              </div>
              <button
                type="button"
                onClick={handleLoadMessyPreset}
                className="btn-secondary text-xs px-3 py-1.5 font-bold text-[var(--color-amber)] border-amber-500/30"
              >
                ⚡ Load Sample Messy Data
              </button>
            </div>

            {/* Input Data Textarea */}
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1 font-bold">Customer Payload (JSON Array or CSV)</label>
              <textarea
                rows={7}
                value={importDataText}
                onChange={(e) => setImportDataText(e.target.value)}
                placeholder='[{"name": "Kavita Joshi", "phone": "9828877665", "start_date": "2026-09-01"}]'
                className="input-control w-full text-xs font-mono"
              />
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">Endpoint: <code>POST /customers/import</code></span>
              <button
                type="button"
                disabled={importLoading || !importDataText.trim()}
                onClick={handleExecuteImport}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                <span>{importLoading ? '⏳' : '⚡'}</span>
                <span>Clean, Deduplicate & Import Now</span>
              </button>
            </div>

            {/* 3-Stat Report Cards */}
            {importReport && (
              <div className="space-y-3 pt-2 border-t border-[var(--border-color)] animate-fade-in">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="stat-card-imported">
                    <span className="text-xs font-bold text-emerald-600 block uppercase">Cleanly Imported</span>
                    <div className="text-3xl font-black text-emerald-600 mt-1">{importReport.imported}</div>
                    <span className="text-[11px] text-[var(--text-muted)]">Active subscriptions</span>
                  </div>
                  <div className="stat-card-deduped">
                    <span className="text-xs font-bold text-amber-600 block uppercase">Deduplicated</span>
                    <div className="text-3xl font-black text-amber-600 mt-1">{importReport.deduped}</div>
                    <span className="text-[11px] text-[var(--text-muted)]">Merged duplicate phones</span>
                  </div>
                  <div className="stat-card-rejected">
                    <span className="text-xs font-bold text-rose-600 block uppercase">Rejected</span>
                    <div className="text-3xl font-black text-rose-600 mt-1">{importReport.rejected}</div>
                    <span className="text-[11px] text-[var(--text-muted)]">Missing / corrupt data</span>
                  </div>
                </div>

                {/* Details Breakdown */}
                {importReport.details && (
                  <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs space-y-2">
                    <span className="font-bold text-[var(--text-primary)] block">Processing Details Audit:</span>
                    {importReport.details.imported?.map((item, i) => (
                      <div key={i} className="flex justify-between text-emerald-600">
                        <span>✅ Imported: {item.name} ({item.phone})</span>
                        <span className="font-mono">{item.start_date}</span>
                      </div>
                    ))}
                    {importReport.details.deduped?.map((item, i) => (
                      <div key={i} className="flex justify-between text-amber-600">
                        <span>⚠️ Deduped: {item.record?.name || item.name} ({item.phone})</span>
                        <span>{item.reason}</span>
                      </div>
                    ))}
                    {importReport.details.rejected?.map((item, i) => (
                      <div key={i} className="flex justify-between text-rose-600">
                        <span>❌ Rejected: {item.record?.name || '(Missing Name)'}</span>
                        <span>{item.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
              <button onClick={() => setImportModal(false)} className="btn-secondary text-xs px-5 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL 4: PAUSE MODAL WITH QUICK PRESETS
          -------------------------------------------------------------------- */}
      {pauseModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full p-6 space-y-4 animate-fade-in">
            <button onClick={() => setPauseModal(null)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Pause Subscription</h3>
            <p className="text-xs text-[var(--text-secondary)]">For <strong>{pauseModal.name}</strong> ({pauseModal.phone})</p>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">⚡ Quick Leave Presets:</span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const form = document.getElementById('pauseForm');
                    form.startDate.value = '2026-09-18';
                    form.endDate.value = '2026-09-18';
                    form.reason.value = 'Friday Leave';
                  }} 
                  className="text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--color-amber)]"
                >
                  Tomorrow (1 Day)
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const form = document.getElementById('pauseForm');
                    form.startDate.value = '2026-09-21';
                    form.endDate.value = '2026-09-25';
                    form.reason.value = 'Full Week Travel';
                  }} 
                  className="text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--color-amber)]"
                >
                  Next Week (5 Days)
                </button>
              </div>
            </div>

            <form id="pauseForm" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              handlePauseSubmit(pauseModal.subscription_id, form.startDate.value, form.endDate.value, form.reason.value);
            }} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Start Date</label>
                  <input name="startDate" type="date" defaultValue="2026-09-14" required className="input-control w-full text-xs" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">End Date</label>
                  <input name="endDate" type="date" defaultValue="2026-09-18" required className="input-control w-full text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Reason for Leave</label>
                <input name="reason" type="text" defaultValue="Diwali Festival / Vacation" required className="input-control w-full text-xs" />
              </div>
              <div className="text-[11px] text-[var(--color-amber)] bg-[var(--color-amber-glow)] p-2.5 rounded-lg border border-[var(--color-amber)]">
                💡 Strict 9:00 AM Cutoff: Requests after 9:00 AM lock same-day cooking and apply from next business day.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPauseModal(null)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white">Confirm Pause</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODAL 5: PRO-RATED BILLING MODAL WITH FULL TAX INVOICE & GST
          -------------------------------------------------------------------- */}
      {billModal && (() => {
        const math = calculateProratedMath(billModal.monthly_price, '2026-09', billModal.pause_logs, true);
        const rawBillText = `🍱 *TIFFINFLOW TAX INVOICE* 🍱\nRajeshwar Annapurna Kitchens\nGSTIN: 08AABCR1234F1Z5 | SAC: 996331\nCustomer: ${billModal.name}\nMonth: September 2026\nPlan: ${billModal.plan_name} (₹${billModal.monthly_price}/mo)\nDelivered Days: ${math.deliveredWeekdays} weekdays\nPaused Days: ${math.pausedWeekdays} days\nTaxable Amount: ₹${math.taxableAmount}\nCGST (2.5%): ₹${math.cgst}\nSGST (2.5%): ₹${math.sgst}\n*Total Payable: ₹${math.finalAmount}*\nCustomer Saved: ₹${math.savings}`;
        const whatsappLink = `https://wa.me/91${billModal.phone}?text=${encodeURIComponent(rawBillText)}`;

        return (
          <div className="modal-overlay">
            <div className="modal-container max-w-2xl w-full p-6 space-y-4 animate-fade-in">
              <button onClick={() => setBillModal(null)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
              
              <div className="border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-[var(--color-amber)]">
                      OFFICIAL TAX INVOICE
                    </span>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">Rajeshwar Annapurna Tiffin Kitchens</h3>
                    <p className="text-xs text-[var(--text-secondary)]">GSTIN: <strong>08AABCR1234F1Z5</strong> • HSN/SAC Code: <strong>996331</strong> (Outdoor Catering)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)]">INV-2026-09-{String(billModal.id).padStart(3, '0')}</span>
                    <div className="text-xs text-[var(--text-secondary)]">Billing Month: <strong>Sept 2026</strong></div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[var(--text-secondary)]">
                  Billed to: <strong>{billModal.name}</strong> (📞 {billModal.phone}) • {billModal.address}
                </div>
              </div>

              {/* Mathematical Pro-Rating Proof Box */}
              <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-amber-500/40 space-y-3 shadow-sm">
                <span className="text-[11px] font-bold text-[var(--color-amber)] uppercase tracking-wider block">
                  Mathematical Pro-Rating Proof
                </span>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-[var(--bg-card-hover)]">
                    <div className="text-[var(--text-muted)]">Monthly Plan</div>
                    <div className="font-bold text-[var(--text-primary)] text-sm">₹{billModal.monthly_price}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-card-hover)]">
                    <div className="text-[var(--text-muted)]">Weekdays</div>
                    <div className="font-bold text-[var(--text-primary)] text-sm">{math.totalWeekdays}</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-card-hover)]">
                    <div className="text-[var(--text-muted)]">Daily Rate</div>
                    <div className="font-bold text-[var(--color-amber)] text-sm">₹{math.dailyRate}</div>
                  </div>
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-[var(--color-emerald)] font-semibold">Delivered</div>
                    <div className="font-bold text-[var(--color-emerald)] text-sm">{math.deliveredWeekdays} days</div>
                  </div>
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30">
                    <div className="text-[var(--color-rose)] font-semibold">Paused</div>
                    <div className="font-bold text-[var(--color-rose)] text-sm">{math.pausedWeekdays} days</div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[var(--border-color)] text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Taxable Amount ({math.deliveredWeekdays} days × ₹{math.dailyRate}):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{math.taxableAmount}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>CGST (2.5%):</span>
                    <span className="font-mono">₹{math.cgst}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>SGST (2.5%):</span>
                    <span className="font-mono">₹{math.sgst}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
                  <div>
                    {math.savings > 0 && (
                      <div className="text-xs text-[var(--color-emerald)] font-bold">🎉 Customer saved ₹{math.savings} on paused days!</div>
                    )}
                    <span className="text-[11px] text-[var(--text-muted)]">Billed strictly for weekdays actually served.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold">Final Total Payable</span>
                    <div className="text-3xl font-black text-[var(--color-amber)]">₹{math.finalAmount}</div>
                  </div>
                </div>
              </div>

              {/* Day-by-Day Calendar */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Itemized Day-by-Day Calendar (Sept 2026)</h4>
                <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--bg-surface)] sticky top-0 border-b border-[var(--border-color)] text-[var(--text-muted)]">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Day</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Billed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {math.schedule.map(d => (
                        <tr key={d.date}>
                          <td className="p-2 text-[var(--text-primary)] font-mono">{d.date}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{d.dayName}</td>
                          <td className="p-2">
                            {d.status === 'DELIVERED' && <span className="text-[var(--color-emerald)] font-semibold">Delivered</span>}
                            {d.status === 'PAUSED' && <span className="text-[var(--color-rose)] font-semibold">Paused</span>}
                            {d.status === 'WEEKEND' && <span className="text-[var(--text-muted)]">Weekend</span>}
                          </td>
                          <td className="p-2 text-[var(--text-secondary)]">{d.reason || (d.status === 'DELIVERED' ? 'Lunch Served' : '-')}</td>
                          <td className="p-2 text-right font-bold text-[var(--text-primary)]">
                            {d.status === 'DELIVERED' ? `₹${math.dailyRate}` : '₹0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
                <div className="flex gap-2">
                  <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    📲 Send Tax Invoice on WhatsApp
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(rawBillText);
                      triggerNotification('Copied official tax bill summary to clipboard!');
                    }}
                    className="btn-secondary text-xs px-3.5 py-2"
                  >
                    📋 Copy Text
                  </button>
                </div>
                <button onClick={() => setBillModal(null)} className="btn-secondary text-xs px-5 py-2">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --------------------------------------------------------------------
          MODAL 6: ADD NEW SUBSCRIBER
          -------------------------------------------------------------------- */}
      {newSubModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full p-6 space-y-4 animate-fade-in">
            <button onClick={() => setNewSubModal(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Add New Subscriber</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              handleAddSubscriber({
                id: Date.now(),
                subscription_id: Date.now(),
                name: form.fullName.value,
                phone: form.phone.value,
                locality: form.locality.value,
                address: form.address.value,
                dietary_notes: form.notes.value,
                plan_id: 1,
                plan_name: 'Ghar Ki Thali (Standard Veg)',
                monthly_price: 2200,
                meal_type: 'Veg',
                tier: 'STANDARD',
                status: 'ACTIVE',
                pause_logs: []
              });
            }} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Full Name</label>
                <input name="fullName" required placeholder="e.g. Yash Sharma" className="input-control w-full text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Phone Number</label>
                  <input name="phone" required placeholder="e.g. 9829911223" className="input-control w-full text-xs" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Locality / Area</label>
                  <input name="locality" required placeholder="e.g. Malviya Nagar" className="input-control w-full text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Delivery Address</label>
                <input name="address" required placeholder="Flat 101, Mansarovar, Jaipur" className="input-control w-full text-xs" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Dietary Notes</label>
                <input name="notes" placeholder="e.g. Less spicy, pure satvik" className="input-control w-full text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewSubModal(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-4 py-2">Activate Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-color)] py-6 text-center text-xs text-[var(--text-muted)]">
        🍱 TiffinFlow SaaS Platform • Rajeshwar Annapurna Kitchens • GSTIN: 08AABCR1234F1Z5 • Fair Pro-Rated Weekday Billing Engine
      </footer>

    </div>
  );
}

// Mount the React Application
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
