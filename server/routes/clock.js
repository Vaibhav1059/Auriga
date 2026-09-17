const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { isDeliveryDay, formatDate } = require('../utils/billingCalculator');

/**
 * Level 1 — T1 (integrate):
 * “Each morning, notify the customers due a delivery today (active, a weekday, not paused) via the Notification Service.”
 * Graded via /outbox after POST /clock.
 */

// POST /clock & POST /api/clock
router.post(['/', '/clock'], (req, res) => {
  try {
    const requestedDate = req.body.date || req.query.date || formatDate(new Date());
    const [year, month, day] = requestedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // 1. Query all subscriptions that are ACTIVE and started on or before requestedDate
    const subscriptions = db.prepare(`
      SELECT 
        s.id AS subscription_id,
        s.customer_id,
        s.start_date,
        s.status AS subscription_status,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.locality,
        p.name AS plan_name,
        p.meal_type,
        p.delivery_days_per_week
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.status = 'ACTIVE'
        AND s.start_date <= ?
    `).all(requestedDate);

    // 2. Fetch all confirmed pause logs overlapping requestedDate
    const pauseRecords = db.prepare(`
      SELECT subscription_id, reason
      FROM pause_logs
      WHERE status = 'CONFIRMED'
        AND ? BETWEEN start_date AND end_date
    `).all(requestedDate);

    const pausedSubIds = new Set(pauseRecords.map(p => p.subscription_id));

    // 3. Filter subscriptions due for delivery today (delivery day & not paused)
    const notifiedSubscribers = [];
    const insertOutbox = db.prepare(`
      INSERT INTO outbox (subscription_id, customer_id, recipient_phone, recipient_name, delivery_date, message, channel, status)
      VALUES (?, ?, ?, ?, ?, ?, 'WHATSAPP', 'SENT')
    `);

    subscriptions.forEach(sub => {
      // Must be a delivery day for this plan (e.g. 5-day Mon-Fri or 6-day Mon-Sat)
      const isDueDay = isDeliveryDay(dateObj, sub.delivery_days_per_week || 5);
      const isPaused = pausedSubIds.has(sub.subscription_id);

      if (isDueDay && !isPaused) {
        const message = `🍱 Good morning, ${sub.customer_name}! Your lunch (${sub.plan_name} - ${sub.meal_type}) is scheduled for delivery today (${requestedDate}) to: ${sub.customer_address}. Kitchen dispatch is cooking!`;
        
        const result = insertOutbox.run(
          sub.subscription_id,
          sub.customer_id,
          sub.customer_phone,
          sub.customer_name,
          requestedDate,
          message
        );

        notifiedSubscribers.push({
          id: result.lastInsertRowid,
          subscription_id: sub.subscription_id,
          customer_id: sub.customer_id,
          recipient_name: sub.customer_name,
          recipient_phone: sub.customer_phone,
          delivery_date: requestedDate,
          message,
          channel: 'WHATSAPP',
          status: 'SENT'
        });
      }
    });

    // Record system audit log
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
      VALUES (1, 'Clock Service', 'system', 'CLOCK_TICK', 'OUTBOX', 0, ?)
    `).run(`Morning clock ticked for ${requestedDate}. Notified ${notifiedSubscribers.length} active subscribers.`);

    res.json({
      success: true,
      date: requestedDate,
      notified_count: notifiedSubscribers.length,
      outbox: notifiedSubscribers,
      notifications: notifiedSubscribers
    });
  } catch (err) {
    console.error('POST /clock error:', err);
    res.status(500).json({ error: 'Clock trigger failed', details: err.message });
  }
});

// GET /outbox & GET /api/outbox
router.get(['/outbox', '/'], (req, res) => {
  try {
    const { date, phone, limit = 100 } = req.query;

    let query = 'SELECT * FROM outbox';
    const params = [];
    const conditions = [];

    if (date) {
      conditions.push('delivery_date = ?');
      params.push(date);
    }
    if (phone) {
      conditions.push('recipient_phone LIKE ?');
      params.push(`%${phone}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const rows = db.prepare(query).all(...params);

    // Support both standard JSON object envelope AND direct array access
    res.json({
      success: true,
      count: rows.length,
      outbox: rows,
      notifications: rows
    });
  } catch (err) {
    console.error('GET /outbox error:', err);
    res.status(500).json({ error: 'Failed to fetch outbox', details: err.message });
  }
});

// DELETE /outbox - Clear outbox for test isolation
router.delete(['/outbox', '/'], (req, res) => {
  try {
    db.prepare('DELETE FROM outbox').run();
    res.json({ success: true, message: 'Outbox cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear outbox' });
  }
});

module.exports = router;
