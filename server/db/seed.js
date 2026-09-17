const db = require('./database');

console.log('[TiffinFlow Seed] Resetting and re-seeding database...');

db.exec(`
  DELETE FROM invoices;
  DELETE FROM pause_logs;
  DELETE FROM subscriptions;
  DELETE FROM customers;
  DELETE FROM plans;
  DELETE FROM users;
`);

// Re-run the auto-seed logic by requiring it fresh
delete require.cache[require.resolve('./database')];
require('./database');

console.log('[TiffinFlow Seed] Database successfully refreshed and seeded!');
