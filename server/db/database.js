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
    -- Users table (Owner / Kitchen Staff)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'owner',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tiffin Plans (Monthly subscriptions)
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      meal_type TEXT NOT NULL, -- 'Veg', 'Jain', 'Non-Veg', 'Diet/High-Protein'
      monthly_price REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      dietary_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'CANCELLED'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    -- Pause Logs (For vacations, festivals, travel leaves)
    CREATE TABLE IF NOT EXISTS pause_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- YYYY-MM-DD (inclusive)
      end_date TEXT NOT NULL,   -- YYYY-MM-DD (inclusive)
      reason TEXT,             -- e.g. 'Diwali Festival', 'Business Trip', 'Sick'
      status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );

    -- Invoices (Month-end pro-rated billing records)
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      billing_month TEXT NOT NULL, -- YYYY-MM
      total_weekdays INTEGER NOT NULL,
      delivered_days INTEGER NOT NULL,
      paused_days INTEGER NOT NULL,
      daily_rate REAL NOT NULL,
      plan_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'UNPAID', -- 'UNPAID', 'PAID'
      payment_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Indexes for high-speed lookups
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_pause_logs_sub ON pause_logs(subscription_id);
  `);

  autoSeedIfEmpty();
}

function autoSeedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount > 0) return;

  console.log('[TiffinFlow DB] Initializing fresh database with realistic seed data...');

  // 1. Admin User
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('Chef Rajesh Sharma', 'admin@tiffinflow.com', adminHash, 'owner');

  // 2. Plans
  const insertPlan = db.prepare(`
    INSERT INTO plans (name, description, meal_type, monthly_price)
    VALUES (?, ?, ?, ?)
  `);

  insertPlan.run(
    'Ghar Ki Thali (Standard Veg)',
    '4 Rotis, Dal Tadka, Seasonal Sabzi, Jeera Rice, Fresh Salad & Pickle',
    'Veg',
    2200
  );
  insertPlan.run(
    'Shuddh Jain Satvik Box',
    'Pure satvik meal without onion, garlic, or root vegetables. 4 Phulkas, Dal, Green Sabzi, Rice, Sweet',
    'Jain',
    2500
  );
  insertPlan.run(
    'Executive Deluxe Thali',
    'Special Paneer Dish, Dal Makhani, 4 Butter Phulkas, Pulao, Raita, Dessert',
    'Veg',
    3000
  );
  insertPlan.run(
    'Fitness High-Protein Meal',
    'Soya chunks/Paneer/Boiled Eggs, Sprouts, Multi-grain rotis, Brown Rice, Dal, High Protein Salad',
    'Diet/High-Protein',
    3400
  );

  // 3. Customers
  const insertCust = db.prepare(`
    INSERT INTO customers (name, phone, email, address, dietary_notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const c1 = insertCust.run('Amit Singhal', '9829012345', 'amit.s@gmail.com', 'Flat 402, Royal Residency, Malviya Nagar, Jaipur', 'Less oil, no extra spicy');
  const c2 = insertCust.run('Pooja Mehta', '9829054321', 'pooja.m@techcorp.com', 'Tower B, Office 305, IT Park, Sitapura', 'Jain food strictly (No onion/garlic)');
  const c3 = insertCust.run('Vikram Rathore', '9116789012', 'vikram.r@gmail.com', 'House 14, Sunrise Enclave, C-Scheme', 'Gym diet, extra salad');
  const c4 = insertCust.run('Sneha Agarwal', '9414098765', 'sneha.ag@outlook.com', 'A-89, Mansarovar, Sector 5', 'Regular spicy, loves curds');
  const c5 = insertCust.run('Karan Verma', '9784112233', 'karan.v@startup.io', 'Co-working Pod 12, World Trade Park, JLN Marg', 'No capsicum in sabzi');
  const c6 = insertCust.run('Ritu Bhasin', '9650044556', 'ritu.bhasin@gmail.com', 'Flat 701, Silver Crest, Jagatpura', 'Allergic to peanuts');
  const c7 = insertCust.run('Deepak Choudhary', '9001234567', 'deepak.c@freelance.org', 'Plot 22, Gopalpura Bypass, Jaipur', 'Extra roti requested');

  // 4. Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (customer_id, plan_id, start_date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const s1 = insertSub.run(c1.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Delivers at 12:45 PM');
  const s2 = insertSub.run(c2.lastInsertRowid, 2, '2026-09-01', 'PAUSED', 'Out of town for family function');
  const s3 = insertSub.run(c3.lastInsertRowid, 4, '2026-09-01', 'ACTIVE', 'Delivers at office desk');
  const s4 = insertSub.run(c4.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Ring bell twice');
  const s5 = insertSub.run(c5.lastInsertRowid, 3, '2026-09-01', 'PAUSED', 'WFH this week');
  const s6 = insertSub.run(c6.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Delivers at reception');
  const s7 = insertSub.run(c7.lastInsertRowid, 1, '2026-09-01', 'ACTIVE', 'Standard delivery');

  // 5. Pause Logs (Demonstrating festival/vacation pause periods)
  const insertPause = db.prepare(`
    INSERT INTO pause_logs (subscription_id, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Pooja paused for 5 weekdays in Sept (Sept 14 to Sept 18)
  insertPause.run(s2.lastInsertRowid, '2026-09-14', '2026-09-18', 'Family Wedding in Udaipur', 'CONFIRMED');

  // Karan paused for 4 weekdays in Sept (Sept 15 to Sept 18)
  insertPause.run(s5.lastInsertRowid, '2026-09-15', '2026-09-18', 'WFH / Travelling', 'CONFIRMED');

  // Amit paused for 2 weekdays (Sept 07 to Sept 08)
  insertPause.run(s1.lastInsertRowid, '2026-09-07', '2026-09-08', 'Festival Fasting', 'CONFIRMED');

  console.log('[TiffinFlow DB] Seed complete: 1 Admin, 4 Plans, 7 Customers, 7 Subscriptions, 3 Pause Logs.');
}

initSchema();

module.exports = db;
