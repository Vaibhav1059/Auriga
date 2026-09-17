const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getTodayISTString, isPastCutoff } = require('../utils/billingCalculator');

// Helper: check if a subscription is paused on a given date (YYYY-MM-DD)
function isSubPausedOnDate(subId, dateStr) {
  const pause = db.prepare(`
    SELECT * FROM pause_logs 
    WHERE subscription_id = ? 
      AND status = 'CONFIRMED'
      AND ? BETWEEN start_date AND end_date
  `).get(subId, dateStr);
  return !!pause;
}

// -------------------------------------------------------------
// 1. KDS (Kitchen Display System - TV Screen Mode)
// -------------------------------------------------------------
router.get('/kds', (req, res) => {
  try {
    const today = req.query.date || getTodayISTString();
    const cutoffPassed = isPastCutoff();

    // Query all active subscriptions with plan & customer info
    const allSubs = db.prepare(`
      SELECT 
        s.id AS subscription_id,
        s.customer_id,
        s.plan_id,
        s.status AS sub_status,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.dietary_notes,
        c.locality,
        p.name AS plan_name,
        p.meal_type,
        p.tier,
        p.delivery_days_per_week
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status != 'CANCELLED'
    `).all();

    // Filter today's active deliveries (exclude weekend if 5-day plan, exclude paused)
    const activeDeliveries = [];
    const pausedDeliveries = [];

    allSubs.forEach(sub => {
      const paused = isSubPausedOnDate(sub.subscription_id, today) || sub.sub_status === 'PAUSED';
      if (paused) {
        pausedDeliveries.push(sub);
      } else {
        activeDeliveries.push(sub);
      }
    });

    // Breakdown counts
    const mealTypeCounts = {
      Veg: 0,
      Jain: 0,
      'Diet/High-Protein': 0,
      'Non-Veg': 0
    };

    const tierCounts = {
      STANDARD: 0,
      DELUXE: 0,
      MINI: 0
    };

    const dietaryAlerts = [];

    activeDeliveries.forEach(sub => {
      // Meal type
      if (mealTypeCounts[sub.meal_type] !== undefined) {
        mealTypeCounts[sub.meal_type]++;
      } else {
        mealTypeCounts[sub.meal_type] = 1;
      }

      // Tier
      if (tierCounts[sub.tier] !== undefined) {
        tierCounts[sub.tier]++;
      } else {
        tierCounts[sub.tier] = 1;
      }

      // Dietary alerts
      if (sub.dietary_notes && sub.dietary_notes.trim() !== '') {
        dietaryAlerts.push({
          subscription_id: sub.subscription_id,
          customer_name: sub.customer_name,
          meal_type: sub.meal_type,
          dietary_notes: sub.dietary_notes,
          locality: sub.locality
        });
      }
    });

    res.json({
      success: true,
      date: today,
      cutoff: {
        time: '09:00 AM IST',
        passed: cutoffPassed,
        status: cutoffPassed ? 'LOCKED_FOR_DISPATCH' : 'ACCEPTING_EDITS'
      },
      summary: {
        total_subscribers: allSubs.length,
        total_active_today: activeDeliveries.length,
        total_paused_today: pausedDeliveries.length
      },
      meal_breakdown: mealTypeCounts,
      tier_breakdown: tierCounts,
      dietary_alerts: dietaryAlerts
    });
  } catch (err) {
    console.error('KDS feed error:', err);
    res.status(500).json({ error: 'Failed to fetch KDS feed', details: err.message });
  }
});

// -------------------------------------------------------------
// 2. Driver Dispatch & Routes
// -------------------------------------------------------------
router.get('/driver-route', (req, res) => {
  try {
    const today = req.query.date || getTodayISTString();

    // Query active subscriptions and customer details
    const subs = db.prepare(`
      SELECT 
        s.id AS subscription_id,
        s.status AS sub_status,
        s.notes AS sub_notes,
        c.id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.locality,
        c.address,
        c.dietary_notes,
        p.name AS plan_name,
        p.meal_type,
        p.tier
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status != 'CANCELLED'
    `).all();

    // Check delivery runs table for today's status
    const deliveryRecords = db.prepare(`
      SELECT subscription_id, status, notes, delivered_at
      FROM delivery_runs
      WHERE delivery_date = ?
    `).all(today);

    const deliveryMap = {};
    deliveryRecords.forEach(rec => {
      deliveryMap[rec.subscription_id] = rec;
    });

    const stops = [];

    subs.forEach(sub => {
      const isPaused = isSubPausedOnDate(sub.subscription_id, today) || sub.sub_status === 'PAUSED';
      if (isPaused) return; // Skip paused homes on driver route!

      const runInfo = deliveryMap[sub.subscription_id];
      const deliveryStatus = runInfo ? runInfo.status : 'PENDING';
      const deliveredAt = runInfo ? runInfo.delivered_at : null;

      // Google Maps 1-tap navigation URL
      const gmapsQuery = encodeURIComponent(`${sub.address}, Jaipur`);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${gmapsQuery}`;

      stops.push({
        subscription_id: sub.subscription_id,
        customer_id: sub.customer_id,
        customer_name: sub.customer_name,
        phone: sub.customer_phone,
        locality: sub.locality,
        address: sub.address,
        maps_url: mapsUrl,
        plan_name: sub.plan_name,
        meal_type: sub.meal_type,
        tier: sub.tier,
        dietary_notes: sub.dietary_notes,
        delivery_notes: sub.sub_notes,
        status: deliveryStatus,
        delivered_at: deliveredAt
      });
    });

    // Group stops by locality for driver efficiency
    const localityClusters = {};
    stops.forEach(stop => {
      if (!localityClusters[stop.locality]) {
        localityClusters[stop.locality] = [];
      }
      localityClusters[stop.locality].push(stop);
    });

    res.json({
      success: true,
      date: today,
      total_stops: stops.length,
      locality_clusters: localityClusters,
      stops: stops
    });
  } catch (err) {
    console.error('Driver route error:', err);
    res.status(500).json({ error: 'Failed to fetch driver route', details: err.message });
  }
});

// Update stop delivery status
router.post('/driver-route/:subId/status', (req, res) => {
  try {
    const { subId } = req.params;
    const { status, notes, driver_name = 'Mukesh Saini' } = req.body;
    const today = req.body.date || getTodayISTString();

    const allowed = ['PENDING', 'DELIVERED', 'DOORBELL_RUNG', 'FAILED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const sub = db.prepare('SELECT customer_id FROM subscriptions WHERE id = ?').get(subId);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const now = new Date().toISOString();

    // Upsert into delivery_runs
    const existing = db.prepare('SELECT id FROM delivery_runs WHERE subscription_id = ? AND delivery_date = ?').get(subId, today);

    if (existing) {
      db.prepare(`
        UPDATE delivery_runs 
        SET status = ?, notes = ?, delivered_at = ?
        WHERE id = ?
      `).run(status, notes || '', now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO delivery_runs (subscription_id, customer_id, delivery_date, status, notes, delivered_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(subId, sub.customer_id, today, status, notes || '', now);
    }

    // Record in Audit Log
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details)
      VALUES (1, ?, 'driver', 'DELIVERY_STATUS_UPDATE', 'DELIVERY_RUN', ?, ?)
    `).run(driver_name, subId, `Stop marked as ${status} at ${now}. Note: ${notes || 'None'}`);

    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      subscription_id: subId,
      status: status,
      timestamp: now
    });
  } catch (err) {
    console.error('Delivery status update error:', err);
    res.status(500).json({ error: 'Failed to update delivery status', details: err.message });
  }
});

// -------------------------------------------------------------
// 3. Enterprise Audit Logs
// -------------------------------------------------------------
router.get('/audit-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

module.exports = router;
