const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { cleanCustomerRecord } = require('../utils/dataCleaner');

/**
 * Level 3 — T4 (messy data):
 * “Import a messy customer list (dup phones, mixed date formats, blanks) into clean subscriptions with an { imported, deduped, rejected } report.”
 * POST /api/customers/import and POST /customers/import
 */
router.post(['/', '/import'], (req, res) => {
  try {
    let rawList = [];

    // Parse payload: either { customers: [...] } or array [...] or raw CSV text
    if (Array.isArray(req.body)) {
      rawList = req.body;
    } else if (req.body && Array.isArray(req.body.customers)) {
      rawList = req.body.customers;
    } else if (typeof req.body === 'string' || (req.body && typeof req.body.csv === 'string')) {
      const csvStr = typeof req.body === 'string' ? req.body : req.body.csv;
      rawList = parseCsv(csvStr);
    } else {
      return res.status(400).json({ error: 'Request body must be an array or { customers: [...] }' });
    }

    const imported = [];
    const deduped = [];
    const rejected = [];

    const batchPhones = new Set();

    // Query existing active phone numbers in database
    const existingActiveSubs = db.prepare(`
      SELECT c.phone 
      FROM customers c
      JOIN subscriptions s ON s.customer_id = c.id
      WHERE s.status != 'CANCELLED'
    `).all();

    const dbActivePhones = new Set(existingActiveSubs.map(r => r.phone));

    const insertCustomer = db.prepare(`
      INSERT INTO customers (name, phone, email, address, locality, dietary_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertSub = db.prepare(`
      INSERT INTO subscriptions (customer_id, plan_id, start_date, status, notes)
      VALUES (?, ?, ?, 'ACTIVE', 'Imported via Bulk Customer Importer')
    `);

    rawList.forEach((raw, idx) => {
      const validation = cleanCustomerRecord(raw);

      // 1. Check if record is rejected due to blank/corrupt fields
      if (!validation.isValid) {
        rejected.push({
          index: idx + 1,
          raw,
          reason: validation.reason
        });
        return;
      }

      const cleaned = validation.cleaned;

      // 2. Check for duplicate phone in current import batch
      if (batchPhones.has(cleaned.phone)) {
        deduped.push({
          index: idx + 1,
          name: cleaned.name,
          phone: cleaned.phone,
          reason: 'Duplicate phone number inside this import batch'
        });
        return;
      }

      // 3. Check for duplicate phone against active database subscriptions
      if (dbActivePhones.has(cleaned.phone)) {
        deduped.push({
          index: idx + 1,
          name: cleaned.name,
          phone: cleaned.phone,
          reason: 'Customer with this phone number already has an active subscription in database'
        });
        return;
      }

      // 4. Record is clean and unique! Insert into database
      try {
        batchPhones.add(cleaned.phone);
        dbActivePhones.add(cleaned.phone);

        // Check if customer row already exists (inactive), or insert fresh
        let customerId;
        const existingCust = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleaned.phone);

        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const custResult = insertCustomer.run(
            cleaned.name,
            cleaned.phone,
            cleaned.email,
            cleaned.address,
            cleaned.locality,
            cleaned.dietary_notes
          );
          customerId = custResult.lastInsertRowid;
        }

        const subResult = insertSub.run(
          customerId,
          cleaned.plan_id || 1,
          cleaned.start_date
        );

        imported.push({
          index: idx + 1,
          customer_id: customerId,
          subscription_id: subResult.lastInsertRowid,
          name: cleaned.name,
          phone: cleaned.phone,
          start_date: cleaned.start_date,
          plan_id: cleaned.plan_id || 1
        });
      } catch (insertErr) {
        rejected.push({
          index: idx + 1,
          raw,
          reason: `Database insertion error: ${insertErr.message}`
        });
      }
    });

    // Record audit trail
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
      VALUES (1, 'Admin', 'owner', 'BULK_IMPORT', 'CUSTOMERS', 0, ?)
    `).run(`Imported customer list: ${imported.length} imported, ${deduped.length} deduped, ${rejected.length} rejected.`);

    // Return the exact required { imported, deduped, rejected } report
    res.json({
      imported: imported.length,
      deduped: deduped.length,
      rejected: rejected.length,
      details: {
        imported,
        deduped,
        rejected
      }
    });

  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Bulk import failed', details: err.message });
  }
});

// Helper: Basic CSV text parser
function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj = {};
    headers.forEach((h, colIdx) => {
      obj[h] = values[colIdx] || '';
    });
    records.push(obj);
  }

  return records;
}

module.exports = router;
