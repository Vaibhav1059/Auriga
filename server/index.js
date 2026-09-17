const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Ensure database schema and seed are ready
require('./db/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/customers/import', require('./routes/import'));
app.use('/customers/import', require('./routes/import'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/subscriptions', require('./routes/subscriptions'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Level 1 Twist T1: /clock and /outbox routes (mounted at both / and /api)
app.use('/api/clock', require('./routes/clock'));
app.use('/clock', require('./routes/clock'));
app.use('/api/outbox', require('./routes/clock'));
app.use('/outbox', require('./routes/clock'));

// Health & System Info endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'TiffinFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV
  });
});

// Serve frontend in production or if client/dist exists; otherwise serve workspace root (preview.html, style.css, app.js)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/clock') || req.path.startsWith('/outbox') || req.path.startsWith('/subscriptions') || req.path.startsWith('/customers')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Serve workspace root so preview.html, style.css, app.js are available directly on http://localhost:5000/
  app.use(express.static(path.join(__dirname, '..')));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../preview.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(config.PORT, () => {
  console.log(`
======================================================
🍱 TIFFINFLOW — Home-Style Tiffin Operating System
======================================================
🚀 Server listening on http://localhost:${config.PORT}
📊 Database: SQLite connected & verified
🔑 Demo Admin Login:
   Email:    admin@tiffinflow.com
   Password: admin123
🌐 GitHub Codespaces: Ready for port forwarding on ${config.PORT}
======================================================
  `);
});
