const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { isWeekday, calculateSplitSubscriptionBill } = require('../utils/billingCalculator');

// GET /api/subscriptions/stats - High-level metrics for owner dashboard
router.get('/stats', (req, res) => {
  try {
    const totalCustomers = db.prepare('SELECT COUNT(*) AS count FROM customers').get().count;
    const activeSubs = db.prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'ACTIVE'").get().count;
    const pausedSubs = db.prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'PAUSED'").get().count;
    
    // Revenue projection based on active monthly plans
    const projectedRev = db.prepare(`
      SELECT SUM(p.monthly_price) AS total 
      FROM subscriptions s 
      JOIN plans p ON p.id = s.plan_id 
      WHERE s.status != 'CANCELLED'
    `).get().total || 0;

    // Today's dispatch count
    const today = new Date().toISOString().split('T')[0];
    const todayDateObj = new Date();
    const isTodayWeekday = isWeekday(todayDateObj);

    // Find all subscriptions that have a pause overlapping today
    const pausedTodayCount = db.prepare(`
      SELECT COUNT(DISTINCT s.id) AS count
      FROM subscriptions s
      JOIN pause_logs pl ON pl.subscription_id = s.id
      WHERE s.status != 'CANCELLED'
        AND ? >= pl.start_date 
        AND ? <= pl.end_date
        AND pl.status = 'CONFIRMED'
    `).get(today, today).count;

    const mealsToCookToday = isTodayWeekday ? Math.max(0, activeSubs - pausedTodayCount) : 0;

    res.json({
      stats: {
        totalCustomers,
        activeSubscriptions: activeSubs,
        pausedSubscriptions: pausedSubs,
        projectedMonthlyRevenue: Math.round(projectedRev),
        todayDate: today,
        isTodayWeekday,
        mealsToCookToday,
        pausedTodayCount
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
});

// GET /api/subscriptions/dispatch - Live Kitchen Dispatch Board (Active vs Paused for target date)
router.get('/dispatch', (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  const dateObj = new Date(targetDate);
  const weekday = isWeekday(dateObj);

  try {
    // Get all subscriptions with customer & plan info
    const allSubs = db.prepare(`
      SELECT 
        s.id AS subscription_id,
        s.status AS subscription_status,
        s.notes AS subscription_notes,
        c.id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.dietary_notes,
        p.id AS plan_id,
        p.name AS plan_name,
        p.meal_type,
        p.monthly_price
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.status != 'CANCELLED'
      ORDER BY c.name ASC
    `).all();

    // Get pause logs overlapping targetDate
    const pauses = db.prepare(`
      SELECT * FROM pause_logs
      WHERE ? >= start_date AND ? <= end_date AND status = 'CONFIRMED'
    `).all(targetDate, targetDate);

    const pauseMap = new Map();
    pauses.forEach(p => pauseMap.set(p.subscription_id, p));

    const cookList = [];
    const pausedList = [];

    allSubs.forEach(sub => {
      const activePause = pauseMap.get(sub.subscription_id);
      const isPaused = Boolean(activePause) || sub.subscription_status === 'PAUSED';

      if (isPaused) {
        pausedList.push({
          ...sub,
          pause_reason: activePause ? activePause.reason : 'Customer paused subscription',
          pause_start: activePause ? activePause.start_date : null,
          pause_end: activePause ? activePause.end_date : null
        });
      } else {
        cookList.push({
          ...sub,
          delivery_status: weekday ? 'READY_TO_COOK' : 'WEEKEND_OFF'
        });
      }
    });

    res.json({
      targetDate,
      isWeekday: weekday,
      summary: {
        totalSubscriptions: allSubs.length,
        mealsToCookCount: weekday ? cookList.length : 0,
        pausedCount: pausedList.length
      },
      cookList,
      pausedList
    });
  } catch (err) {
    console.error('Dispatch sheet error:', err);
    res.status(500).json({ error: 'Failed to generate kitchen dispatch board.' });
  }
});

// POST /api/subscriptions - Create / subscribe a customer to a plan
router.post('/', authMiddleware, (req, res) => {
  const { customer_id, plan_id, start_date, notes } = req.body;

  if (!customer_id || !plan_id || !start_date) {
    return res.status(400).json({ error: 'customer_id, plan_id, and start_date are required.' });
  }

  try {
    // Check if customer already has an active subscription
    const existing = db.prepare(`
      SELECT id FROM subscriptions 
      WHERE customer_id = ? AND status != 'CANCELLED'
    `).get(customer_id);

    if (existing) {
      return res.status(400).json({ error: 'Customer already has an active subscription.' });
    }

    const result = db.prepare(`
      INSERT INTO subscriptions (customer_id, plan_id, start_date, status, notes)
      VALUES (?, ?, ?, 'ACTIVE', ?)
    `).run(customer_id, plan_id, start_date, notes || '');

    const newSub = db.prepare(`
      SELECT s.*, c.name AS customer_name, p.name AS plan_name
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Subscription activated', subscription: newSub });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to create subscription.' });
  }
});

// POST /api/subscriptions/:id/pause - Pause subscription with date range
router.post('/:id/pause', authMiddleware, (req, res) => {
  const subscriptionId = req.params.id;
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required for pausing.' });
  }

  if (start_date > end_date) {
    return res.status(400).json({ error: 'start_date cannot be after end_date.' });
  }

  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Insert pause log
    const pauseResult = db.prepare(`
      INSERT INTO pause_logs (subscription_id, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, 'CONFIRMED')
    `).run(subscriptionId, start_date, end_date, reason || 'Customer vacation/festival leave');

    // If today is within or on the pause range, mark subscription status as PAUSED
    const today = new Date().toISOString().split('T')[0];
    if (today >= start_date && today <= end_date) {
      db.prepare("UPDATE subscriptions SET status = 'PAUSED' WHERE id = ?").run(subscriptionId);
    }

    const createdPause = db.prepare('SELECT * FROM pause_logs WHERE id = ?').get(pauseResult.lastInsertRowid);

    res.json({
      message: `Subscription paused from ${start_date} to ${end_date}`,
      pauseLog: createdPause
    });
  } catch (err) {
    console.error('Pause error:', err);
    res.status(500).json({ error: 'Failed to pause subscription.' });
  }
});

// POST /api/subscriptions/:id/resume - Resume a paused subscription immediately
router.post('/:id/resume', authMiddleware, (req, res) => {
  const subscriptionId = req.params.id;

  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Update status to ACTIVE
    db.prepare("UPDATE subscriptions SET status = 'ACTIVE' WHERE id = ?").run(subscriptionId);

    // If there is an active open-ended pause, terminate it at yesterday
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE pause_logs 
      SET end_date = ? 
      WHERE subscription_id = ? AND start_date <= ? AND end_date >= ?
    `).run(today, subscriptionId, today, today);

    res.json({ message: 'Subscription successfully resumed to ACTIVE.' });
  } catch (err) {
    console.error('Resume error:', err);
    res.status(500).json({ error: 'Failed to resume subscription.' });
  }
});

/**
 * Level 2 — T6 (lifecycle):
 * “Transfer a subscription to a new customer mid-cycle; the plan and cycle carry over, billing splits by who was served.”
 * POST /api/subscriptions/:id/transfer and POST /subscriptions/:id/transfer
 */
router.post('/:id/transfer', (req, res) => {
  const subscriptionId = req.params.id;
  const { 
    to_customer_id, 
    new_name, 
    new_phone, 
    new_address, 
    new_locality,
    transfer_date,
    notes = 'Mid-cycle subscription transfer'
  } = req.body;

  if (!transfer_date) {
    return res.status(400).json({ error: 'transfer_date (YYYY-MM-DD) is required.' });
  }

  try {
    // 1. Validate subscription
    const sub = db.prepare(`
      SELECT s.*, p.monthly_price, p.delivery_days_per_week, p.name AS plan_name, c.name AS cust_a_name, c.phone AS cust_a_phone
      FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?
    `).get(subscriptionId);

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (sub.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot transfer a cancelled subscription.' });
    }

    const fromCustomerId = sub.customer_id;

    // 2. Resolve recipient Customer B
    let targetCustomerId = to_customer_id;

    if (!targetCustomerId) {
      if (!new_name || !new_phone) {
        return res.status(400).json({ error: 'Either to_customer_id OR (new_name, new_phone) must be provided.' });
      }

      // Find or create customer
      const existingCust = db.prepare('SELECT id, name, phone FROM customers WHERE phone LIKE ?').get(`%${new_phone.slice(-10)}%`);
      if (existingCust) {
        targetCustomerId = existingCust.id;
      } else {
        const createResult = db.prepare(`
          INSERT INTO customers (name, phone, address, locality, dietary_notes)
          VALUES (?, ?, ?, ?, 'Transferred subscriber')
        `).run(new_name, new_phone, new_address || 'Jaipur', new_locality || 'Malviya Nagar');
        targetCustomerId = createResult.lastInsertRowid;
      }
    }

    if (Number(fromCustomerId) === Number(targetCustomerId)) {
      return res.status(400).json({ error: 'Cannot transfer subscription to the same customer.' });
    }

    const custB = db.prepare('SELECT id, name, phone, address FROM customers WHERE id = ?').get(targetCustomerId);
    if (!custB) {
      return res.status(404).json({ error: 'Target recipient customer not found.' });
    }

    // 3. Compute mid-cycle split billing
    const billingMonth = transfer_date.substring(0, 7); // e.g. "2026-09"
    const pauseLogsA = db.prepare(`
      SELECT * FROM pause_logs
      WHERE subscription_id = ? AND status = 'CONFIRMED'
    `).all(subscriptionId);

    const splitBilling = calculateSplitSubscriptionBill({
      monthlyPrice: sub.monthly_price,
      billingMonth,
      transferDate: transfer_date,
      pauseLogsA,
      pauseLogsB: [],
      daysPerWeek: sub.delivery_days_per_week || 5,
      includeGst: true
    });

    // 4. Update subscription ownership
    db.prepare(`
      UPDATE subscriptions 
      SET customer_id = ?, notes = ?
      WHERE id = ?
    `).run(targetCustomerId, `Transferred from ${sub.cust_a_name} on ${transfer_date}. ${notes}`, subscriptionId);

    // 5. Record immutable record in subscription_transfers table
    const transferRecord = db.prepare(`
      INSERT INTO subscription_transfers (
        subscription_id, from_customer_id, to_customer_id, transfer_date, billing_month,
        customer_a_days, customer_a_amount, customer_b_days, customer_b_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subscriptionId,
      fromCustomerId,
      targetCustomerId,
      transfer_date,
      billingMonth,
      splitBilling.customer_a.daysServed,
      splitBilling.customer_a.finalAmount,
      splitBilling.customer_b.daysServed,
      splitBilling.customer_b.finalAmount,
      notes
    );

    // 6. Record Audit Log
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
      VALUES (1, 'System', 'owner', 'SUBSCRIPTION_TRANSFERRED', 'SUBSCRIPTION', ?, ?)
    `).run(
      subscriptionId,
      `Transferred mid-cycle from ${sub.cust_a_name} (${sub.cust_a_phone}) to ${custB.name} (${custB.phone}) on ${transfer_date}. Split: ₹${splitBilling.customer_a.finalAmount} / ₹${splitBilling.customer_b.finalAmount}`
    );

    res.json({
      success: true,
      message: `Subscription successfully transferred to ${custB.name} on ${transfer_date}.`,
      transfer_id: transferRecord.lastInsertRowid,
      subscription_id: Number(subscriptionId),
      plan_name: sub.plan_name,
      billing_month: billingMonth,
      transfer_date: transfer_date,
      from_customer: {
        id: fromCustomerId,
        name: sub.cust_a_name,
        phone: sub.cust_a_phone
      },
      to_customer: {
        id: custB.id,
        name: custB.name,
        phone: custB.phone
      },
      billing_split: splitBilling
    });

  } catch (err) {
    console.error('Subscription transfer error:', err);
    res.status(500).json({ error: 'Failed to transfer subscription', details: err.message });
  }
});

module.exports = router;
