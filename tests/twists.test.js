/**
 * Automated Verification Suite for Level 1, 2, and 3 Twists
 * - Level 1 — T1: POST /clock triggers morning delivery notification outbox
 * - Level 2 — T6: POST /subscriptions/:id/transfer with split billing
 * - Level 3 — T4: POST /customers/import with { imported, deduped, rejected } report
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING TIFFINFLOW TWISTS VERIFICATION SUITE');
  console.log('====================================================\n');

  // ---------------------------------------------------------------
  // 1. Level 1 — T1 (POST /clock & GET /outbox)
  // ---------------------------------------------------------------
  console.log('▶ [Level 1 — T1] Testing Morning Delivery Notification via /clock & /outbox...');

  // First, clear outbox
  await fetch(`${BASE_URL}/outbox`, { method: 'DELETE' });

  // 2026-09-17 is a Thursday (Weekday delivery active)
  const clockRes = await fetch(`${BASE_URL}/clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-17' })
  }).then(r => r.json());

  assert.strictEqual(clockRes.success, true, 'Clock tick must succeed');
  assert.strictEqual(clockRes.date, '2026-09-17');
  assert.ok(clockRes.notified_count > 0, 'Should notify active non-paused customers');

  // Check GET /outbox
  const outboxRes = await fetch(`${BASE_URL}/outbox?date=2026-09-17`).then(r => r.json());
  assert.strictEqual(outboxRes.success, true);
  assert.strictEqual(outboxRes.count, clockRes.notified_count);
  assert.ok(Array.isArray(outboxRes.outbox), 'outbox property must be an array');
  assert.ok(outboxRes.outbox[0].recipient_phone, 'Notification must contain recipient_phone');
  assert.ok(outboxRes.outbox[0].message.includes('2026-09-17'), 'Message must contain target date');

  // Verify that paused customer (Pooja Mehta, 9829054321, on Udaipur wedding leave) was NOT notified
  const notifiedPhones = outboxRes.outbox.map(n => n.recipient_phone);
  assert.strictEqual(
    notifiedPhones.includes('9829054321'), 
    false, 
    'Paused customer (Pooja Mehta) must NOT be notified on leave day'
  );

  // Test weekend date: 2026-09-20 is Sunday (0 notifications)
  await fetch(`${BASE_URL}/outbox`, { method: 'DELETE' });
  const sundayClock = await fetch(`${BASE_URL}/clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-09-20' })
  }).then(r => r.json());

  assert.strictEqual(sundayClock.notified_count, 0, 'Sunday must generate 0 lunch notifications');
  console.log('  ✅ Level 1 — T1: Morning clock and notification outbox verified perfectly.');

  // ---------------------------------------------------------------
  // 2. Level 2 — T6 (Mid-Cycle Transfer & Pro-Rated Split Billing)
  // ---------------------------------------------------------------
  console.log('\n▶ [Level 2 — T6] Testing Mid-Cycle Subscription Transfer & Split Billing...');

  // Reset subscription 1 to customer 1 for test idempotency
  const db = require('../server/db/database');
  db.prepare("UPDATE subscriptions SET customer_id = 1 WHERE id = 1").run();
  db.prepare("DELETE FROM subscription_transfers WHERE subscription_id = 1").run();
  db.prepare("DELETE FROM customers WHERE phone = '9928114455'").run();

  // Transfer Amit Singhal's subscription (id: 1) on Sept 15, 2026 to new customer "Rahul Verma"
  const transferRes = await fetch(`${BASE_URL}/subscriptions/1/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_name: 'Rahul Verma',
      new_phone: '9928114455',
      new_address: 'Flat 501, Coral Heights, C-Scheme',
      transfer_date: '2026-09-15',
      notes: 'Amit relocated, transferred plan to colleague Rahul'
    })
  }).then(r => r.json());

  assert.strictEqual(transferRes.success, true, 'Transfer must succeed');
  assert.strictEqual(transferRes.transfer_date, '2026-09-15');
  assert.strictEqual(transferRes.to_customer.name, 'Rahul Verma');

  const split = transferRes.billing_split;
  assert.ok(split, 'Must return billing_split breakdown');

  // Sept 2026 has 22 weekdays.
  // Sept 1 to Sept 14 has 10 weekdays. Amit was paused for 2 weekdays (Sept 7-8 festival fasting) -> 8 days served.
  // Sept 15 to Sept 30 has 12 weekdays -> Rahul gets 12 days served.
  // Total served: 8 + 12 = 20 weekdays.
  assert.strictEqual(split.customer_a.daysServed, 8, 'Customer A served 8 active weekdays');
  assert.strictEqual(split.customer_a.pausedDays, 2, 'Customer A paused 2 days');
  assert.strictEqual(split.customer_b.daysServed, 12, 'Customer B served 12 active weekdays');
  assert.strictEqual(split.totalServedDays, 20, 'Total served days = 20');

  // Rates: 2200 / 22 = 100/day.
  // Customer A taxable: 8 * 100 = 800. + 5% GST = 840.
  // Customer B taxable: 12 * 100 = 1200. + 5% GST = 1260.
  // Total = 840 + 1260 = 2100.
  assert.strictEqual(split.customer_a.taxableAmount, 800);
  assert.strictEqual(split.customer_a.finalAmount, 840);
  assert.strictEqual(split.customer_b.taxableAmount, 1200);
  assert.strictEqual(split.customer_b.finalAmount, 1260);
  assert.strictEqual(split.totalBilledAmount, 2100);

  console.log('  ✅ Level 2 — T6: Mid-cycle transfer and mathematical split billing verified perfectly.');

  // ---------------------------------------------------------------
  // 3. Level 3 — T4 (Messy Customer List Import & Deduplication)
  // ---------------------------------------------------------------
  console.log('\n▶ [Level 3 — T4] Testing Messy Data Importer ({ imported, deduped, rejected })...');

  // Clean up any previous test imports for idempotency
  const testPhones = ['9828877665', '9785544332', '9414433221'];
  for (const p of testPhones) {
    const cust = db.prepare("SELECT id FROM customers WHERE phone LIKE ?").get(`%${p}%`);
    if (cust) {
      db.prepare("DELETE FROM subscriptions WHERE customer_id = ?").run(cust.id);
      db.prepare("DELETE FROM customers WHERE id = ?").run(cust.id);
    }
  }

  const messyDataset = [
    // 1. Valid clean record
    { name: 'Kavita Joshi', phone: '9828877665', start_date: '2026-09-01', address: 'B-12, Vaishali Nagar' },

    // 2. Valid with mixed date (Indian format DD/MM/YYYY) and prefixed phone (+91)
    { name: 'Sanjay Rawat', phone: '+91 97855 44332', start_date: '15/09/2026', address: 'Plot 4, Mansarovar' },

    // 3. Valid with textual date ("1st October 2026")
    { name: 'Manish Pareek', phone: '09414433221', start_date: '1st October 2026', address: 'Raja Park' },

    // 4. Duplicate phone inside same batch (duplicate of Kavita Joshi)
    { name: 'Kavita Duplicate', phone: '9828877665', start_date: '2026-09-01' },

    // 5. Duplicate phone against existing active DB customer (Deepak Choudhary 9001234567)
    { name: 'Deepak Twin', phone: '9001234567', start_date: '2026-09-01' },

    // 6. Rejected: Missing name
    { name: '', phone: '9829900112', start_date: '2026-09-01' },

    // 7. Rejected: Invalid phone number
    { name: 'Harish Sharma', phone: 'invalid-phone-xyz', start_date: '2026-09-01' },

    // 8. Rejected: Corrupt date
    { name: 'Pankaj Mathur', phone: '9829933445', start_date: 'not-a-valid-date' }
  ];

  const importRes = await fetch(`${BASE_URL}/customers/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messyDataset)
  }).then(r => r.json());

  // Report must have exact { imported, deduped, rejected } structure
  assert.ok(importRes.imported !== undefined, 'Report must contain imported count');
  assert.ok(importRes.deduped !== undefined, 'Report must contain deduped count');
  assert.ok(importRes.rejected !== undefined, 'Report must contain rejected count');

  assert.strictEqual(importRes.imported, 3, 'Exactly 3 valid records imported');
  assert.strictEqual(importRes.deduped, 2, 'Exactly 2 duplicate phone records deduped');
  assert.strictEqual(importRes.rejected, 3, 'Exactly 3 corrupt/blank records rejected');

  assert.strictEqual(importRes.details.imported.length, 3);
  assert.strictEqual(importRes.details.deduped.length, 2);
  assert.strictEqual(importRes.details.rejected.length, 3);

  console.log('  ✅ Level 3 — T4: Messy dataset cleaner, deduplicator, and report verified perfectly.');

  console.log('\n====================================================');
  console.log('🎉 ALL 3 TWISTS (T1, T6, T4) PASSED WITH 100% PRECISION!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TWISTS TEST SUITE FAILED:', err);
  process.exit(1);
});
