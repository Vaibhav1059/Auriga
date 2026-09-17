const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

// GET /api/customers/lookup?phone=XXXX - Instant phone lookup for tiffin owner
router.get('/lookup', (req, res) => {
  const { phone } = req.query;

  if (!phone || phone.trim().length === 0) {
    return res.status(400).json({ error: 'Phone query parameter is required.' });
  }

  const cleanPhone = phone.trim();

  try {
    // Exact or partial phone match
    const customer = db.prepare(`
      SELECT 
        c.*,
        s.id AS subscription_id,
        s.start_date,
        s.status AS subscription_status,
        s.notes AS subscription_notes,
        p.id AS plan_id,
        p.name AS plan_name,
        p.monthly_price,
        p.meal_type
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id
      LEFT JOIN plans p ON p.id = s.plan_id
      WHERE c.phone LIKE ?
      ORDER BY s.id DESC
      LIMIT 1
    `).get(`%${cleanPhone}%`);

    if (!customer) {
      return res.status(404).json({ message: 'No customer found with phone matching ' + cleanPhone });
    }

    // Also fetch their active or upcoming pause logs
    let pauseLogs = [];
    if (customer.subscription_id) {
      pauseLogs = db.prepare(`
        SELECT * FROM pause_logs 
        WHERE subscription_id = ? 
        ORDER BY start_date DESC
      `).all(customer.subscription_id);
    }

    // Check if customer is paused TODAY
    const today = new Date().toISOString().split('T')[0];
    const isPausedToday = pauseLogs.some(p => today >= p.start_date && today <= p.end_date && p.status === 'CONFIRMED');

    res.json({
      customer: {
        ...customer,
        is_paused_today: isPausedToday,
        effective_today_status: isPausedToday ? 'PAUSED' : (customer.subscription_status || 'INACTIVE')
      },
      pauseLogs
    });
  } catch (err) {
    console.error('Phone lookup error:', err);
    res.status(500).json({ error: 'Failed to perform phone lookup.' });
  }
});

// GET /api/customers - List customers with search, sort, and pagination
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : '';
    const statusFilter = req.query.status ? req.query.status.trim() : '';
    const sortBy = req.query.sortBy || 'c.id';
    const order = req.query.order && req.query.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Whitelist sort columns to prevent SQL injection
    const allowedSortCols = {
      'id': 'c.id',
      'name': 'c.name',
      'phone': 'c.phone',
      'plan_price': 'p.monthly_price',
      'status': 's.status',
      'start_date': 's.start_date'
    };
    const sortColumn = allowedSortCols[sortBy] || 'c.id';

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(c.name LIKE ? OR c.phone LIKE ? OR c.address LIKE ? OR p.name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClauses.push('s.status = ?');
      params.push(statusFilter);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ${whereSql}
    `;
    const total = db.prepare(countSql).get(...params).total;

    // Data query
    const dataSql = `
      SELECT 
        c.id, c.name, c.phone, c.email, c.address, c.dietary_notes, c.created_at,
        s.id AS subscription_id, s.start_date, s.status AS subscription_status, s.notes AS subscription_notes,
        p.id AS plan_id, p.name AS plan_name, p.monthly_price, p.meal_type
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ${whereSql}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

    const customers = db.prepare(dataSql).all(...params, limit, offset);

    res.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
});

// GET /api/customers/:id - Customer details by ID
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT 
        c.*,
        s.id AS subscription_id, s.start_date, s.status AS subscription_status, s.notes AS subscription_notes,
        p.id AS plan_id, p.name AS plan_name, p.monthly_price, p.meal_type
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id
      LEFT JOIN plans p ON p.id = s.plan_id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const pauseLogs = customer.subscription_id ? db.prepare(`
      SELECT * FROM pause_logs WHERE subscription_id = ? ORDER BY start_date DESC
    `).all(customer.subscription_id) : [];

    const invoices = customer.subscription_id ? db.prepare(`
      SELECT * FROM invoices WHERE subscription_id = ? ORDER BY id DESC
    `).all(customer.subscription_id) : [];

    res.json({ customer, pauseLogs, invoices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer.' });
  }
});

// POST /api/customers - Add new customer
router.post('/', authMiddleware, (req, res) => {
  const { name, phone, email, address, dietary_notes } = req.body;

  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Name, phone, and delivery address are required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone.trim());
    if (existing) {
      return res.status(409).json({ error: 'A customer with this phone number already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address, dietary_notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), phone.trim(), email || '', address.trim(), dietary_notes || '');

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Customer created', customer: newCustomer });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer.' });
  }
});

module.exports = router;
