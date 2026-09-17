/**
 * Automated Unit Tests for TiffinFlow Pro-Rated Billing Engine
 * Tests weekday-only delivery, pause/resume exclusions, and invoice math.
 */

const assert = require('assert');
const { calculateProratedBill, isWeekday } = require('../server/utils/billingCalculator');

console.log('----------------------------------------------------');
console.log('🧪 RUNNING TIFFINFLOW PRO-RATED BILLING TEST SUITE');
console.log('----------------------------------------------------');

// Test 1: Weekday check logic
{
  // 2026-09-01 is a Tuesday (Weekday)
  const tuesday = new Date(2026, 8, 1);
  assert.strictEqual(isWeekday(tuesday), true, 'Tuesday must be a weekday');

  // 2026-09-05 is a Saturday (Weekend)
  const saturday = new Date(2026, 8, 5);
  assert.strictEqual(isWeekday(saturday), false, 'Saturday must NOT be a weekday');

  // 2026-09-06 is a Sunday (Weekend)
  const sunday = new Date(2026, 8, 6);
  assert.strictEqual(isWeekday(sunday), false, 'Sunday must NOT be a weekday');

  console.log('✅ Test 1 Passed: Weekday / Weekend identification is correct.');
}

// Test 2: Full month with NO pauses
{
  // In September 2026, there are 30 days. 22 are Mon-Fri weekdays, 8 are weekend days.
  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs: []
  });

  assert.strictEqual(result.totalWeekdaysInMonth, 22, 'September 2026 has exactly 22 weekdays');
  assert.strictEqual(result.deliveredDays, 22, 'All 22 days should be delivered');
  assert.strictEqual(result.pausedDays, 0, '0 paused days');
  assert.strictEqual(result.dailyRate, 100, 'Daily rate: 2200 / 22 = 100');
  assert.strictEqual(result.finalAmount, 2200, 'Final bill should equal full monthly price (2200)');
  assert.strictEqual(result.savingsForCustomer, 0, 'No savings when zero pauses');

  console.log('✅ Test 2 Passed: Full month zero-pause calculation matches baseline.');
}

// Test 3: Customer pauses for 5 weekdays (e.g. Festival / Vacation)
{
  // Pause from Monday Sept 14, 2026 to Friday Sept 18, 2026 (5 weekdays)
  const pauseLogs = [
    { start_date: '2026-09-14', end_date: '2026-09-18', reason: 'Diwali Festival' }
  ];

  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs
  });

  assert.strictEqual(result.totalWeekdaysInMonth, 22);
  assert.strictEqual(result.pausedDays, 5, 'Should count exactly 5 paused weekdays');
  assert.strictEqual(result.deliveredDays, 17, '22 - 5 = 17 delivered weekdays');
  assert.strictEqual(result.dailyRate, 100);
  assert.strictEqual(result.finalAmount, 1700, 'Final bill should be 17 * 100 = 1700');
  assert.strictEqual(result.savingsForCustomer, 500, 'Customer saved 500 on 5 paused days');

  // Verify itemized schedule
  const pausedDaysInSchedule = result.itemizedDays.filter(d => d.status === 'PAUSED');
  assert.strictEqual(pausedDaysInSchedule.length, 5);
  assert.strictEqual(pausedDaysInSchedule[0].charge, 0, 'Paused day charge must be 0');

  console.log('✅ Test 3 Passed: 5-day pause pro-rated discount calculated with 100% precision.');
}

// Test 4: Pause period includes weekends (e.g. Friday to Tuesday)
{
  // Friday Sept 18 to Tuesday Sept 22 (Friday, Mon, Tue = 3 weekdays; Sat, Sun = weekend)
  const pauseLogs = [
    { start_date: '2026-09-18', end_date: '2026-09-22', reason: 'Weekend Trip' }
  ];

  const result = calculateProratedBill({
    monthlyPrice: 2200,
    billingMonth: '2026-09',
    startDate: '2026-09-01',
    pauseLogs
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
    pauseLogs: []
  });

  // Sept 1 to Sept 14 has 10 weekdays.
  // Sept 15 to Sept 30 has 12 weekdays.
  assert.strictEqual(result.beforeStartDays, 10, '10 weekdays before subscription start');
  assert.strictEqual(result.deliveredDays, 12, '12 delivered weekdays after start');
  assert.strictEqual(result.finalAmount, 1200, 'Final bill: 12 * 100 = 1200');

  console.log('✅ Test 5 Passed: Mid-month start pro-rating behaves cleanly.');
}

console.log('----------------------------------------------------');
console.log('🎉 ALL 5 PRO-RATED BILLING TESTS PASSED PERFECTLY!');
console.log('----------------------------------------------------');
