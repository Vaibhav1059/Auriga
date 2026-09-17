/**
 * Automated Unit Tests for TiffinFlow Pro-Rated Billing Engine
 * Tests weekday/6-day delivery rules, pause/resume exclusions, 9:00 AM cutoff, and GST tax invoicing.
 */

const assert = require('assert');
const { 
  calculateProratedBill, 
  isDeliveryDay, 
  isWeekday, 
  evaluateSameDayCutoff 
} = require('../server/utils/billingCalculator');

console.log('----------------------------------------------------');
console.log('🧪 RUNNING TIFFINFLOW PRO-RATED BILLING TEST SUITE');
console.log('----------------------------------------------------');

// Test 1: Weekday & 6-Day delivery identification
{
  const tuesday = new Date(2026, 8, 1);
  const saturday = new Date(2026, 8, 5);
  const sunday = new Date(2026, 8, 6);

  assert.strictEqual(isWeekday(tuesday), true, 'Tuesday must be a weekday');
  assert.strictEqual(isWeekday(saturday), false, 'Saturday must NOT be a weekday in 5-day plan');
  assert.strictEqual(isWeekday(sunday), false, 'Sunday must NOT be a weekday');

  // 6-day plan includes Saturday
  assert.strictEqual(isDeliveryDay(saturday, 6), true, 'Saturday IS a delivery day in 6-day plan');
  assert.strictEqual(isDeliveryDay(sunday, 6), false, 'Sunday is never a delivery day');

  console.log('✅ Test 1 Passed: Weekday / Weekend & 6-Day identification is correct.');
}

// Test 2: Full month with NO pauses (Taxable & GST verification)
{
  // In September 2026, 22 weekdays. Monthly price: 2200.
  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs: [],
    includeGst: true
  });

  assert.strictEqual(result.totalWeekdaysInMonth, 22, 'September 2026 has exactly 22 weekdays');
  assert.strictEqual(result.deliveredDays, 22, 'All 22 days should be delivered');
  assert.strictEqual(result.pausedDays, 0, '0 paused days');
  assert.strictEqual(result.dailyRate, 100, 'Daily rate: 2200 / 22 = 100');
  assert.strictEqual(result.taxableAmount, 2200, 'Taxable amount equals 2200');
  assert.strictEqual(result.cgst, 55, 'CGST 2.5% on 2200 = 55');
  assert.strictEqual(result.sgst, 55, 'SGST 2.5% on 2200 = 55');
  assert.strictEqual(result.finalAmount, 2310, 'Final bill with 5% GST = 2310');
  assert.strictEqual(result.savingsForCustomer, 0, 'No savings when zero pauses');

  console.log('✅ Test 2 Passed: Full month zero-pause calculation with 5% GST matches baseline.');
}

// Test 3: Customer pauses for 5 weekdays (e.g. Festival / Vacation)
{
  const pauseLogs = [
    { start_date: '2026-09-14', end_date: '2026-09-18', reason: 'Diwali Festival' }
  ];

  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs,
    includeGst: false
  });

  assert.strictEqual(result.totalWeekdaysInMonth, 22);
  assert.strictEqual(result.pausedDays, 5, 'Should count exactly 5 paused weekdays');
  assert.strictEqual(result.deliveredDays, 17, '22 - 5 = 17 delivered weekdays');
  assert.strictEqual(result.dailyRate, 100);
  assert.strictEqual(result.taxableAmount, 1700, 'Taxable bill should be 17 * 100 = 1700');
  assert.strictEqual(result.finalAmount, 1700, 'Final bill without GST = 1700');
  assert.strictEqual(result.savingsForCustomer, 500, 'Customer saved 500 on 5 paused days');

  // Verify itemized schedule
  const pausedDaysInSchedule = result.itemizedDays.filter(d => d.status === 'PAUSED');
  assert.strictEqual(pausedDaysInSchedule.length, 5);
  assert.strictEqual(pausedDaysInSchedule[0].charge, 0, 'Paused day charge must be 0');

  console.log('✅ Test 3 Passed: 5-day pause pro-rated discount calculated with 100% precision.');
}

// Test 4: Pause period spans across a weekend (Friday to Tuesday)
{
  const pauseLogs = [
    { start_date: '2026-09-18', end_date: '2026-09-22', reason: 'Weekend Trip' }
  ];

  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs,
    includeGst: false
  });

  // Weekdays paused: Sept 18 (Fri), Sept 21 (Mon), Sept 22 (Tue) = 3 weekdays
  assert.strictEqual(result.pausedDays, 3, 'Only 3 weekdays paused despite 5 calendar days');
  assert.strictEqual(result.deliveredDays, 19, '22 - 3 = 19 delivered weekdays');
  assert.strictEqual(result.finalAmount, 1900, 'Final bill should be 19 * 100 = 1900');

  console.log('✅ Test 4 Passed: Weekend days within a pause range are not double-deducted.');
}

// Test 5: Mid-month subscription starting on Sept 15
{
  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-15',
    pauseLogs: [],
    includeGst: false
  });

  assert.strictEqual(result.beforeStartDays, 10, '10 weekdays before subscription start');
  assert.strictEqual(result.deliveredDays, 12, '12 delivered weekdays after start');
  assert.strictEqual(result.finalAmount, 1200, 'Final bill: 12 * 100 = 1200');

  console.log('✅ Test 5 Passed: Mid-month start pro-rating behaves cleanly.');
}

// Test 6: 6-Day Plan (Corporate office including Saturdays)
{
  const result = calculateProratedBill({
    monthlyPrice: 2600,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    daysPerWeek: 6,
    pauseLogs: [],
    includeGst: false
  });

  // September 2026 has 22 weekdays + 4 Saturdays = 26 delivery days
  assert.strictEqual(result.totalWeekdaysInMonth, 26, 'Sept 2026 has 26 Mon-Sat delivery days');
  assert.strictEqual(result.deliveredDays, 26);
  assert.strictEqual(result.dailyRate, 100, '2600 / 26 = 100/day');
  assert.strictEqual(result.finalAmount, 2600);

  console.log('✅ Test 6 Passed: 6-day delivery plan counts Saturdays accurately.');
}

// Test 7: 9:00 AM Same-day Cutoff Evaluation
{
  const beforeCutoff = new Date(2026, 8, 17, 8, 30, 0); // 8:30 AM
  const afterCutoff = new Date(2026, 8, 17, 9, 15, 0);  // 9:15 AM

  const eval1 = evaluateSameDayCutoff('2026-09-17', beforeCutoff);
  assert.strictEqual(eval1.isPastCutoff, false, '8:30 AM is before 9:00 AM cutoff');

  const eval2 = evaluateSameDayCutoff('2026-09-17', afterCutoff);
  assert.strictEqual(eval2.isPastCutoff, true, '9:15 AM is past 9:00 AM cutoff');

  console.log('✅ Test 7 Passed: 9:00 AM strict cutoff policy evaluated accurately.');
}

// Test 8: GST HSN/SAC Code & Tax Invoice Breakdown
{
  const result = calculateProratedBill({
    monthlyPrice: 3000,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs: [{ start_date: '2026-09-01', end_date: '2026-09-02' }], // 2 days paused = 20 days delivered
    includeGst: true
  });

  // Daily rate = 3000 / 22 = 136.36
  // Delivered 20 days: 20 * 136.36 = 2727.20
  // CGST (2.5%) = 68.18, SGST (2.5%) = 68.18
  // Total = 2727.20 + 136.36 = 2863.56
  assert.strictEqual(result.hsnSacCode, '996331', 'HSN/SAC must be 996331');
  assert.strictEqual(result.cgst, 68.18);
  assert.strictEqual(result.sgst, 68.18);
  assert.strictEqual(result.finalAmount, 2863.63);

  console.log('✅ Test 8 Passed: GST HSN/SAC 996331 and CGST/SGST split validated.');
}

console.log('----------------------------------------------------');
console.log('🎉 ALL 8 PRO-RATED BILLING & CUTOFF TESTS PASSED PERFECTLY!');
console.log('----------------------------------------------------');
