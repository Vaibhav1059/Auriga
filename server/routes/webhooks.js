const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * POST /api/webhooks/whatsapp
 * Simulates Meta WhatsApp Cloud API webhook receiver for automated customer bot.
 * Accepts commands: "PAUSE", "PAUSE YYYY-MM-DD YYYY-MM-DD", "RESUME", "MENU", "BILL"
 */
router.post('/whatsapp', (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required in WhatsApp webhook.' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanMsg = message.trim().toUpperCase();

  try {
    // 1. Look up customer by phone
    const customer = db.prepare(`
      SELECT c.*, s.id AS subscription_id, s.status AS sub_status, p.name AS plan_name, p.monthly_price
      FROM customers c
      JOIN subscriptions s ON s.customer_id = c.id
      JOIN plans p ON p.id = s.plan_id
      WHERE c.phone LIKE ?
      LIMIT 1
    `).get(`%${cleanPhone.slice(-10)}%`);

    if (!customer) {
      return res.json({
        reply: `Hello! We could not find an active subscription linked to ${phone}. Please contact the kitchen at +91-9829001122 to subscribe.`
      });
    }

    // 2. Command Processing
    let reply = '';
    const todayStr = new Date().toISOString().split('T')[0];

    if (cleanMsg.startsWith('PAUSE')) {
      const parts = cleanMsg.split(/\s+/);
      let startDate = todayStr;
      let endDate = todayStr;

      if (parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1]) && /^\d{4}-\d{2}-\d{2}$/.test(parts[2])) {
        startDate = parts[1];
        endDate = parts[2];
      }

      // Check 9:00 AM cutoff if pausing for today
      const currentHour = new Date().getHours();
      let notice = '';
      if (startDate === todayStr && currentHour >= 9) {
        notice = ' (Note: Today is past the 9:00 AM cutoff. Kitchen is already cooking today; pause begins tomorrow).';
      }

      db.prepare(`
        INSERT INTO pause_logs (tenant_id, subscription_id, start_date, end_date, reason, requested_via, status)
        VALUES (?, ?, ?, ?, 'WhatsApp Bot Command', 'WHATSAPP_BOT', 'CONFIRMED')
      `).run(customer.tenant_id, customer.subscription_id, startDate, endDate);

      db.prepare("UPDATE subscriptions SET status = 'PAUSED' WHERE id = ?").run(customer.subscription_id);

      // Log into immutable audit logs
      db.prepare(`
        INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
        VALUES (?, ?, 'customer', 'WHATSAPP_PAUSE', 'SUBSCRIPTION', ?, ?)
      `).run(customer.tenant_id, customer.name, customer.subscription_id, `Paused via WhatsApp bot: ${startDate} to ${endDate}${notice}`);

      reply = `⏸️ Done, ${customer.name}! Your tiffin subscription is paused from ${startDate} to ${endDate}.${notice} You will NOT be billed for these days.`;

    } else if (cleanMsg === 'RESUME' || cleanMsg === 'UNPAUSE') {
      db.prepare("UPDATE subscriptions SET status = 'ACTIVE' WHERE id = ?").run(customer.subscription_id);

      db.prepare(`
        INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
        VALUES (?, ?, 'customer', 'WHATSAPP_RESUME', 'SUBSCRIPTION', ?, 'Reactivated lunch via WhatsApp')
      `).run(customer.tenant_id, customer.name, customer.subscription_id);

      reply = `▶️ Welcome back, ${customer.name}! Your tiffin delivery is now ACTIVE. Lunch will be delivered to: ${customer.address}.`;

    } else if (cleanMsg === 'MENU') {
      reply = `🍲 *Today's TiffinFlow Menu:*\n• Main: Paneer Butter Masala & Seasonal Aloo Gobi\n• Dal: Dal Tadka with Ghee\n• Breads: 4 Butter Phulkas\n• Rice: Steamed Jeera Rice\n• Accompaniment: Boondi Raita & Gulab Jamun`;

    } else if (cleanMsg === 'BILL') {
      reply = `💳 *Month-End Bill Calculation:*\nPlan: ${customer.plan_name} (₹${customer.monthly_price}/mo)\nYour bill is pro-rated daily for weekdays served. Type "MENU" or "PAUSE" anytime!`;

    } else {
      reply = `🍱 *TiffinFlow WhatsApp Assistant:*\nReply with:\n• *PAUSE* (or *PAUSE YYYY-MM-DD YYYY-MM-DD*) to skip lunch during leave\n• *RESUME* to restart delivery\n• *MENU* to see today's sabzi/dal\n• *BILL* to check your pro-rated balance.`;
    }

    res.json({
      status: 'success',
      sender: customer.name,
      reply
    });

  } catch (err) {
    console.error('WhatsApp Webhook Error:', err);
    res.status(500).json({ error: 'Webhook processing error', details: err.message });
  }
});

/**
 * POST /api/webhooks/payment
 * Razorpay / Cashfree / UPI AutoPay Webhook for auto-reconciliation.
 */
router.post('/payment', (req, res) => {
  const { invoice_id, payment_id, status, amount } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ error: 'invoice_id is required' });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE invoices
      SET status = 'PAID', payment_date = ?
      WHERE id = ?
    `).run(todayStr, invoice_id);

    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
      VALUES (1, 'Payment Gateway', 'system', 'PAYMENT_RECONCILED', 'INVOICE', ?, ?)
    `).run(invoice_id, `Auto-reconciled via UPI webhook payment_id=${payment_id || 'UPI-REF-001'}`);

    res.json({ status: 'reconciled', invoice_id, paid: true });
  } catch (err) {
    res.status(500).json({ error: 'Payment reconciliation error' });
  }
});

module.exports = router;
