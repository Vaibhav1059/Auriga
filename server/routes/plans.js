const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

// GET /api/plans - List all active subscription plans
router.get('/', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY monthly_price ASC').all();
    res.json({ plans });
  } catch (err) {
    console.error('Fetch plans error:', err);
    res.status(500).json({ error: 'Failed to retrieve plans.' });
  }
});

// GET /api/plans/:id - Get plan by ID
router.get('/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve plan.' });
  }
});

// POST /api/plans - Create new subscription plan
router.post('/', authMiddleware, (req, res) => {
  const { name, description, meal_type, monthly_price } = req.body;

  if (!name || !monthly_price || !meal_type) {
    return res.status(400).json({ error: 'Name, meal_type, and monthly_price are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO plans (name, description, meal_type, monthly_price)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), description || '', meal_type, parseFloat(monthly_price));

    const newPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Plan created successfully', plan: newPlan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan.' });
  }
});

module.exports = router;
