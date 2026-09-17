const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { calculateProratedBill } = require('../utils/billingCalculator');

// GET /api/billing/calculate/:subscriptionId?month=YYYY-MM
// Calculates exact pro-rated bill for customer's days delivered
router.get('/calculate/:subscriptionId', (req, res) => {
  const subscriptionId = req.params.subscriptionId;
  const billingMonth = req.query.month || new Date().toISOString().slice(0, 7); // Defaults to current YYYY-MM

  try {
    const sub = db.prepare(`
      SELECT 
        s.id AS subscription_id,
        s.start_date,
        s.status AS subscription_status,
        c.id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        p.id AS plan_id,
        p.name AS plan_name,
        p.meal_type,
        p.monthly_price
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.id = ?
    `).get(subscriptionId);

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Get pause logs that could overlap this month
    const [year, month] = billingMonth.split('-');
    const firstDayOfMonth = `${year}-${month}-01`;
    const lastDayOfMonth = `${year}-${month}-${new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()}`;

    const pauseLogs = db.prepare(`
      SELECT * FROM pause_logs
      WHERE subscription_id = ?
        AND status = 'CONFIRMED'
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY start_date ASC
    `).all(subscriptionId, lastDayOfMonth, firstDayOfMonth);

    const calculation = calculateProratedBill({
      monthlyPrice: sub.monthly_price,
      billingMonth,
      startDate: sub.start_date,
      pauseLogs
    });

    // Check if an invoice has already been generated
    const existingInvoice = db.prepare(`
      SELECT * FROM invoices 
      WHERE subscription_id = ? AND billing_month = ?
    `).get(subscriptionId, billingMonth);

    res.json({
      customer: {
        id: sub.customer_id,
        name: sub.customer_name,
        phone: sub.customer_phone,
        address: sub.customer_address
      },
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        meal_type: sub.meal_type,
        monthly_price: sub.monthly_price
      },
      calculation,
      existingInvoice: existingInvoice || null
    });
  } catch (err) {
    console.error('Calculate bill error:', err);
    res.status(500).json({ error: 'Failed to calculate pro-rated bill.' });
  }
});

// POST /api/billing/generate-invoice - Persist month-end pro-rated invoice
router.post('/generate-invoice', authMiddleware, (req, res) => {
  const { subscription_id, billing_month } = req.body;

  if (!subscription_id || !billing_month) {
    return res.status(400).json({ error: 'subscription_id and billing_month are required.' });
  }

  try {
    const sub = db.prepare(`
      SELECT s.*, p.monthly_price, c.id AS customer_id
      FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?
    `).get(subscription_id);

    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Check if invoice already exists
    const existing = db.prepare(`
      SELECT * FROM invoices 
      WHERE subscription_id = ? AND billing_month = ?
    `).get(subscription_id, billing_month);

    if (existing) {
      return res.status(400).json({ 
        error: `Invoice for ${billing_month} has already been generated.`,
        invoice: existing 
      });
    }

    // Get pause logs
    const [year, month] = billing_month.split('-');
    const firstDayOfMonth = `${year}-${month}-01`;
    const lastDayOfMonth = `${year}-${month}-${new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()}`;

    const pauseLogs = db.prepare(`
      SELECT * FROM pause_logs
      WHERE subscription_id = ? AND status = 'CONFIRMED'
        AND start_date <= ? AND end_date >= ?
    `).all(subscription_id, lastDayOfMonth, firstDayOfMonth);

    const calc = calculateProratedBill({
      monthlyPrice: sub.monthly_price,
      billingMonth: billing_month,
      startDate: sub.start_date,
      pauseLogs
    });

    const result = db.prepare(`
      INSERT INTO invoices (
        subscription_id, customer_id, billing_month, total_weekdays, 
        delivered_days, paused_days, daily_rate, plan_price, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID')
    `).run(
      subscription_id,
      sub.customer_id,
      billing_month,
      calc.totalWeekdaysInMonth,
      calc.deliveredDays,
      calc.pausedDays,
      calc.dailyRate,
      calc.monthlyPrice,
      calc.finalAmount
    );

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Pro-rated month-end invoice generated successfully',
      invoice,
      calculation: calc
    });
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
});

// GET /api/billing/invoices - Paginated invoice list with customer details
router.get('/invoices', (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) AS total FROM invoices').get().total;

    const invoices = db.prepare(`
      SELECT 
        inv.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        p.name AS plan_name
      FROM invoices inv
      JOIN customers c ON c.id = inv.customer_id
      JOIN subscriptions s ON s.id = inv.subscription_id
      JOIN plans p ON p.id = s.plan_id
      ORDER BY inv.id DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
});

// POST /api/billing/invoices/:id/pay - Mark invoice as paid
router.post('/invoices/:id/pay', authMiddleware, (req, res) => {
  const invoiceId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = db.prepare(`
      UPDATE invoices 
      SET status = 'PAID', payment_date = ? 
      WHERE id = ?
    `).run(today, invoiceId);

    if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found.' });

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    res.json({ message: 'Invoice marked as PAID', invoice: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice.' });
  }
});

module.exports = router;
