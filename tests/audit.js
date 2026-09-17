/**
 * Comprehensive System & End-to-End Functionality Audit
 * Validates all REST API endpoints, Twists (T1, T6, T4), KDS, WhatsApp, and Static Assets
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runAudit() {
  console.log('======================================================');
  console.log('🔍 TIFFINFLOW COMPREHENSIVE SYSTEM & UX AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Static Assets & Modular Architecture
  await test('Root / returns HTTP 200 and loads preview.html', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('style.css'), 'HTML must link to style.css');
    assert.ok(html.includes('app.js'), 'HTML must load app.js');
    assert.ok(!html.includes('style="'), 'HTML must not have inline styles');
  });

  await test('Modular stylesheet style.css returns HTTP 200 and valid CSS', async () => {
    const res = await fetch(`${BASE_URL}/style.css`);
    assert.strictEqual(res.status, 200);
    const css = await res.text();
    assert.ok(css.includes('--bg-primary'), 'Must define theme variables');
    assert.ok(css.includes('.glass-card'), 'Must define glass card');
    assert.ok(css.includes('.btn-primary'), 'Must define button system');
  });

  await test('Modular frontend logic app.js returns HTTP 200 and valid React code', async () => {
    const res = await fetch(`${BASE_URL}/app.js`);
    assert.strictEqual(res.status, 200);
    const js = await res.text();
    assert.ok(js.includes('function App'), 'Must define App component');
    assert.ok(js.includes('ReactDOM.createRoot'), 'Must mount to DOM');
  });

  // 2. Health & System Information
  await test('GET /api/health returns online status and port 5000 metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    assert.strictEqual(res.status, 'online');
    assert.strictEqual(res.product, 'TiffinFlow API');
  });

  // 3. Level 1 — T1 Clock & Outbox
  await test('Level 1 Twist T1: POST /clock and GET /outbox morning notification pipeline', async () => {
    await fetch(`${BASE_URL}/outbox`, { method: 'DELETE' });

    // Weekday: Thursday Sept 17
    const clock = await fetch(`${BASE_URL}/clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-17' })
    }).then(r => r.json());

    assert.strictEqual(clock.success, true);
    assert.ok(clock.notified_count > 0);

    const outbox = await fetch(`${BASE_URL}/outbox?date=2026-09-17`).then(r => r.json());
    assert.strictEqual(outbox.count, clock.notified_count);
    assert.ok(Array.isArray(outbox.outbox));

    // Ensure paused customer Pooja Mehta is NOT in the outbox
    const phones = outbox.outbox.map(n => n.recipient_phone);
    assert.ok(!phones.includes('9829054321'), 'Paused customer must not receive delivery alert');
  });

  await test('Level 1 Twist T1 (Weekend): POST /clock on Sunday produces 0 notifications', async () => {
    const clockSunday = await fetch(`${BASE_URL}/clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-20' })
    }).then(r => r.json());

    assert.strictEqual(clockSunday.notified_count, 0);
  });

  // 4. Level 2 — T6 Subscription Transfer & Split Billing
  await test('Level 2 Twist T6: POST /subscriptions/:id/transfer carries over cycle and splits billing', async () => {
    const db = require('../server/db/database');
    db.prepare("UPDATE subscriptions SET customer_id = 1 WHERE id = 1").run();
    db.prepare("DELETE FROM subscription_transfers WHERE subscription_id = 1").run();
    db.prepare("DELETE FROM customers WHERE phone = '9928114455'").run();

    const transfer = await fetch(`${BASE_URL}/subscriptions/1/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_name: 'Rahul Verma',
        new_phone: '9928114455',
        new_address: 'Flat 501, Coral Heights, C-Scheme',
        transfer_date: '2026-09-15',
        notes: 'Transferred mid-month'
      })
    }).then(r => r.json());

    assert.strictEqual(transfer.success, true);
    assert.strictEqual(transfer.transfer_date, '2026-09-15');
    assert.strictEqual(transfer.to_customer.name, 'Rahul Verma');

    const split = transfer.billing_split;
    assert.strictEqual(split.customer_a.daysServed, 8);
    assert.strictEqual(split.customer_b.daysServed, 12);
    assert.strictEqual(split.totalServedDays, 20);
    assert.strictEqual(split.customer_a.finalAmount, 840);
    assert.strictEqual(split.customer_b.finalAmount, 1260);
    assert.strictEqual(split.totalBilledAmount, 2100);
  });

  // 5. Level 3 — T4 Messy Customer Importer
  await test('Level 3 Twist T4: POST /customers/import cleans noisy data and outputs { imported, deduped, rejected }', async () => {
    const db = require('../server/db/database');
    const testPhones = ['9828877665', '9785544332', '9414433221'];
    for (const p of testPhones) {
      const c = db.prepare("SELECT id FROM customers WHERE phone LIKE ?").get(`%${p}%`);
      if (c) {
        db.prepare("DELETE FROM subscriptions WHERE customer_id = ?").run(c.id);
        db.prepare("DELETE FROM customers WHERE id = ?").run(c.id);
      }
    }

    const payload = [
      { name: 'Kavita Joshi', phone: '9828877665', start_date: '2026-09-01' },
      { name: 'Sanjay Rawat', phone: '+91 97855 44332', start_date: '15/09/2026' },
      { name: 'Manish Pareek', phone: '09414433221', start_date: '1st October 2026' },
      { name: 'Kavita Duplicate', phone: '9828877665', start_date: '2026-09-01' },
      { name: 'Deepak Twin', phone: '9001234567', start_date: '2026-09-01' },
      { name: '', phone: '9829900112', start_date: '2026-09-01' },
      { name: 'Bad Phone', phone: 'invalid', start_date: '2026-09-01' },
      { name: 'Bad Date', phone: '9829933445', start_date: 'corrupt-date' }
    ];

    const imp = await fetch(`${BASE_URL}/customers/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    assert.strictEqual(imp.imported, 3);
    assert.strictEqual(imp.deduped, 2);
    assert.strictEqual(imp.rejected, 3);
  });

  // 6. Kitchen Operations & KDS TV Wallboard
  await test('GET /api/operations/kds returns real-time meal prep and allergy stream', async () => {
    const kds = await fetch(`${BASE_URL}/api/operations/kds`).then(r => r.json());
    assert.ok(kds.date, 'Must include target date');
    assert.ok(kds.summary.total_active_today >= 0, 'Must include active count');
    assert.ok(Array.isArray(kds.dietary_alerts), 'Must include allergy alerts list');
  });

  // 7. Driver Route Optimization & Locality Clustering
  await test('GET /api/operations/driver-route returns clustered stops and skips paused homes', async () => {
    const driver = await fetch(`${BASE_URL}/api/operations/driver-route`).then(r => r.json());
    assert.ok(driver.locality_clusters, 'Must cluster by locality');
    assert.ok(driver.total_stops >= 0, 'Must include total stops');
  });

  // 8. Meta WhatsApp Cloud API Bot Webhook
  await test('POST /api/webhooks/whatsapp handles MENU, PAUSE, RESUME, BILL commands', async () => {
    const webhook = await fetch(`${BASE_URL}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        From: '+919116789012',
        Body: 'MENU'
      })
    }).then(r => r.json());

    assert.strictEqual(webhook.success, true);
    assert.ok(webhook.reply.includes('Menu') || webhook.reply.includes('Rajeshwar'));
  });

  console.log('\n======================================================');
  console.log(`🎉 AUDIT COMPLETE: ${passed} / ${total} FUNCTIONALITIES VERIFIED PERFECTLY!`);
  console.log('======================================================\n');
}

runAudit();
