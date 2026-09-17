const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');

const db = new Database(config.DB_PATH);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Enterprises / Multi-tenant isolation
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      gstin TEXT,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table (Owner / Kitchen Staff / Cooks / Drivers)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'owner', -- 'super_admin', 'owner', 'cook', 'driver'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    -- Tiffin Plans (Monthly subscriptions with delivery days config)
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      meal_type TEXT NOT NULL, -- 'Veg', 'Jain', 'Non-Veg', 'Diet/High-Protein'
      tier TEXT DEFAULT 'STANDARD', -- 'MINI', 'STANDARD', 'DELUXE'
      delivery_days_per_week INTEGER DEFAULT 5, -- 5 (Mon-Fri) or 6 (Mon-Sat)
      monthly_price REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      locality TEXT NOT NULL DEFAULT 'Malviya Nagar',
      address TEXT NOT NULL,
      dietary_notes TEXT,
      credit_balance REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    -- Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      customer_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'CANCELLED'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    -- Pause Logs (For vacations, festivals, travel leaves)
    CREATE TABLE IF NOT EXISTS pause_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      subscription_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- YYYY-MM-DD (inclusive)
      end_date TEXT NOT NULL,   -- YYYY-MM-DD (inclusive)
      reason TEXT,             -- e.g. 'Diwali Festival', 'Business Trip'
      requested_via TEXT DEFAULT 'DASHBOARD', -- 'DASHBOARD', 'WHATSAPP_BOT', 'PHONE'
      status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );

    -- Invoices (Month-end pro-rated billing records with GST)
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      subscription_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      billing_month TEXT NOT NULL, -- YYYY-MM
      invoice_number TEXT UNIQUE,
      total_weekdays INTEGER NOT NULL,
      delivered_days INTEGER NOT NULL,
      paused_days INTEGER NOT NULL,
      daily_rate REAL NOT NULL,
      plan_price REAL NOT NULL,
      taxable_amount REAL NOT NULL,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'UNPAID', -- 'UNPAID', 'PAID'
      payment_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Daily Delivery Runs (For Driver Mobile Dispatch)
    CREATE TABLE IF NOT EXISTS delivery_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      subscription_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      delivery_date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'DELIVERED', 'FAILED', 'DOORBELL_RUNG'
      locality TEXT,
      delivered_at DATETIME,
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Immutable Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    -- Outbox for Morning Delivery Notifications (Level 1 Twist T1)
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER,
      customer_id INTEGER,
      recipient_phone TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT DEFAULT 'WHATSAPP',
      status TEXT DEFAULT 'SENT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Subscription Mid-Cycle Transfers & Split Billing (Level 2 Twist T6)
    CREATE TABLE IF NOT EXISTS subscription_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      from_customer_id INTEGER NOT NULL,
      to_customer_id INTEGER NOT NULL,
      transfer_date TEXT NOT NULL,
      billing_month TEXT NOT NULL,
      customer_a_days INTEGER NOT NULL,
      customer_a_amount REAL NOT NULL,
      customer_b_days INTEGER NOT NULL,
      customer_b_amount REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (from_customer_id) REFERENCES customers(id),
      FOREIGN KEY (to_customer_id) REFERENCES customers(id)
    );

    -- Indexes for high-speed lookups
    CREATE INDEX IF NOT EXISTS idx_outbox_date ON outbox(delivery_date);
    CREATE INDEX IF NOT EXISTS idx_transfers_sub ON subscription_transfers(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_locality ON customers(locality);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_pause_logs_sub ON pause_logs(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_runs_date ON delivery_runs(delivery_date, status);
  `);

  autoSeedIfEmpty();
}

function autoSeedIfEmpty() {
  const tenantCount = db.prepare('SELECT COUNT(*) AS count FROM tenants').get().count;
  if (tenantCount > 0) return;

  console.log('[TiffinFlow DB] Initializing Enterprise database schema with rich seed data...');

  // 1. Enterprise Tenant
  const insertTenant = db.prepare(`
    INSERT INTO tenants (name, slug, gstin, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `);
  const tenant = insertTenant.run(
    'Rajeshwar Annapurna Tiffin Kitchens',
    'rajeshwar-jaipur',
    '08AABCR1234F1Z5',
    '+91-9829001122',
    'Plot 15, Food Craft Zone, Sitapura Industrial Area, Jaipur 302022'
  );
  const tenantId = tenant.lastInsertRowid;

  // 2. Users (Owner, Cook, Driver)
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const insertUser = db.prepare(`
    INSERT INTO users (tenant_id, name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(tenantId, 'Chef Rajesh Sharma', 'admin@tiffinflow.com', '9829001122', adminHash, 'owner');
  insertUser.run(tenantId, 'Ramu Maharaj (Head Cook)', 'cook@tiffinflow.com', '9829003344', adminHash, 'cook');
  insertUser.run(tenantId, 'Mukesh Saini (Lead Driver)', 'driver@tiffinflow.com', '9829005566', adminHash, 'driver');

  // 3. Plans
  const insertPlan = db.prepare(`
    INSERT INTO plans (tenant_id, name, description, meal_type, tier, delivery_days_per_week, monthly_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlan.run(tenantId, 'Ghar Ki Thali (Standard Veg)', '4 Rotis, Dal Tadka, Seasonal Sabzi, Jeera Rice, Fresh Salad & Pickle', 'Veg', 'STANDARD', 5, 2200);
  insertPlan.run(tenantId, 'Shuddh Jain Satvik Box', 'Pure satvik meal without onion, garlic, or root vegetables. 4 Phulkas, Dal, Green Sabzi, Rice, Sweet', 'Jain', 'STANDARD', 5, 2500);
  insertPlan.run(tenantId, 'Executive Deluxe Thali', 'Special Paneer Dish, Dal Makhani, 4 Butter Phulkas, Pulao, Raita, Dessert', 'Veg', 'DELUXE', 5, 3000);
  insertPlan.run(tenantId, 'Fitness High-Protein Meal', 'Paneer/Soya/Boiled Sprouts, Multi-grain rotis, Brown Rice, Dal, Salad', 'Diet/High-Protein', 'DELUXE', 5, 3400);
  insertPlan.run(tenantId, 'Corporate 6-Day Power Thali', 'Includes Saturday Office Lunch. Standard hearty vegetarian meal', 'Veg', 'STANDARD', 6, 2600);

  // 4. Customers
  const insertCust = db.prepare(`
    INSERT INTO customers (tenant_id, name, phone, email, locality, address, dietary_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = insertCust.run(tenantId, 'Amit Singhal', '9829012345', 'amit.s@gmail.com', 'Malviya Nagar', 'Flat 402, Royal Residency, Malviya Nagar, Jaipur', 'Less oil, no extra spicy');
  const c2 = insertCust.run(tenantId, 'Pooja Mehta', '9829054321', 'pooja.m@techcorp.com', 'Sitapura', 'Tower B, Office 305, IT Park, Sitapura', 'Jain food strictly (No onion/garlic)');
  const c3 = insertCust.run(tenantId, 'Vikram Rathore', '9116789012', 'vikram.r@gmail.com', 'C-Scheme', 'House 14, Sunrise Enclave, C-Scheme', 'Gym diet, extra salad');
  const c4 = insertCust.run(tenantId, 'Sneha Agarwal', '9414098765', 'sneha.ag@outlook.com', 'Mansarovar', 'A-89, Mansarovar, Sector 5', 'Regular spicy, loves curds');
  const c5 = insertCust.run(tenantId, 'Karan Verma', '9784112233', 'karan.v@startup.io', 'Malviya Nagar', 'Co-working Pod 12, World Trade Park, JLN Marg', 'No capsicum in sabzi');
  const c6 = insertCust.run(tenantId, 'Ritu Bhasin', '9650044556', 'ritu.bhasin@gmail.com', 'Jagatpura', 'Flat 701, Silver Crest, Jagatpura', 'Allergic to peanuts');
  const c7 = insertCust.run(tenantId, 'Deepak Choudhary', '9001234567', 'deepak.c@freelance.org', 'Gopalpura', 'Plot 22, Gopalpura Bypass, Jaipur', 'Extra roti requested');

  // 5. Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (tenant_id, customer_id, plan_id, start_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertSub.run(tenantId, c1.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Delivers at 12:45 PM');
  const s2 = insertSub.run(tenantId, c2.lastInsertRowid, 2, '2026-09-01', 'PAUSED', 'Out of town for family function');
  const s3 = insertSub.run(tenantId, c3.lastInsertRowid, 4, '2026-09-01', 'ACTIVE', 'Delivers at office desk');
  const s4 = insertSub.run(tenantId, c4.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Ring bell twice');
  const s5 = insertSub.run(tenantId, c5.lastInsertRowid, 3, '2026-09-01', 'PAUSED', 'WFH this week');
  const s6 = insertSub.run(tenantId, c6.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Delivers at reception');
  const s7 = insertSub.run(tenantId, c7.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Standard delivery');

  // 6. Pause Logs
  const insertPause = db.prepare(`
    INSERT INTO pause_logs (tenant_id, subscription_id, start_date, end_date, reason, requested_via, status)
    VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
  `);

  insertPause.run(tenantId, s2.lastInsertRowid, '2026-09-14', '2026-09-18', 'Family Wedding in Udaipur', 'WHATSAPP_BOT');
  insertPause.run(tenantId, s5.lastInsertRowid, '2026-09-15', '2026-09-18', 'WFH / Travelling', 'DASHBOARD');
  insertPause.run(tenantId, s1.lastInsertRowid, '2026-09-07', '2026-09-08', 'Festival Fasting', 'WHATSAPP_BOT');

  // 7. Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(tenantId, 'Chef Rajesh', 'owner', 'CREATE_TENANT', 'TENANT', tenantId, 'Registered Rajeshwar Annapurna Tiffin Kitchens with GSTIN 08AABCR1234F1Z5');
  insertAudit.run(tenantId, 'Pooja Mehta', 'customer', 'SCHEDULE_PAUSE', 'PAUSE_LOG', 1, 'Customer requested pause for Udaipur wedding (Sept 14-18) via WhatsApp Bot');
  insertAudit.run(tenantId, 'Chef Rajesh', 'owner', 'CUTOFF_LOCKED', 'SYSTEM', 0, '9:00 AM Morning Cutoff locked kitchen prep numbers');

  console.log('[TiffinFlow DB] Enterprise seed complete: Multi-tenancy, Audit Logs, KDS, & Delivery Routes ready.');
}

initSchema();

module.exports = db;
