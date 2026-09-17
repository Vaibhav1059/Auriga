/**
 * Billing Calculator for TiffinFlow
 * Implements strict weekday-only delivery and pro-rated month-end billing math.
 */

function isWeekday(dateObj) {
  const day = dateObj.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates pro-rated month-end bill for a subscription.
 *
 * @param {Object} params
 * @param {number} params.monthlyPrice - Regular monthly plan cost
 * @param {string} params.billingMonth - 'YYYY-MM' (e.g. '2026-09')
 * @param {string} params.startDate - Subscription start date 'YYYY-MM-DD'
 * @param {Array}  params.pauseLogs - Array of { start_date, end_date, reason }
 * @returns {Object} Pro-rated breakdown and day-by-day calendar
 */
function calculateProratedBill({ monthlyPrice, billingMonth, startDate, pauseLogs = [] }) {
  const [yearStr, monthStr] = billingMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  let totalWeekdaysInMonth = 0;
  let activeWeekdays = 0;
  let pausedWeekdays = 0;
  let beforeStartWeekdays = 0;
  const itemizedDays = [];

  const subStartDateStr = startDate || `${yearStr}-${monthStr}-01`;

  // First pass: Count total weekdays in the month for determining the baseline daily rate
  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month - 1, d);
    if (isWeekday(current)) {
      totalWeekdaysInMonth++;
    }
  }

  // Daily weekday rate: monthly price divided by total weekdays in this month
  const dailyRate = totalWeekdaysInMonth > 0 ? (monthlyPrice / totalWeekdaysInMonth) : 0;

  // Second pass: Categorize each day of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month - 1, d);
    const dateStr = formatDate(current);
    const weekday = isWeekday(current);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });

    let status = 'DELIVERED';
    let charge = dailyRate;
    let reason = null;

    if (!weekday) {
      status = 'WEEKEND';
      charge = 0;
    } else if (dateStr < subStartDateStr) {
      status = 'NOT_STARTED';
      charge = 0;
      beforeStartWeekdays++;
    } else {
      // Check if paused on this date
      const activePause = pauseLogs.find(p => {
        return dateStr >= p.start_date && dateStr <= p.end_date;
      });

      if (activePause) {
        status = 'PAUSED';
        charge = 0;
        reason = activePause.reason || 'Customer Requested Pause';
        pausedWeekdays++;
      } else {
        status = 'DELIVERED';
        charge = dailyRate;
        activeWeekdays++;
      }
    }

    itemizedDays.push({
      date: dateStr,
      day: d,
      dayName,
      isWeekday: weekday,
      status,
      charge: parseFloat(charge.toFixed(2)),
      reason
    });
  }

  const finalAmount = parseFloat((activeWeekdays * dailyRate).toFixed(2));
  const fullMonthSavings = parseFloat((pausedWeekdays * dailyRate).toFixed(2));

  return {
    billingMonth,
    monthlyPrice: parseFloat(monthlyPrice.toFixed(2)),
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    totalWeekdaysInMonth,
    deliveredDays: activeWeekdays,
    pausedDays: pausedWeekdays,
    beforeStartDays: beforeStartWeekdays,
    finalAmount,
    savingsForCustomer: fullMonthSavings,
    itemizedDays
  };
}

module.exports = {
  isWeekday,
  formatDate,
  calculateProratedBill
};
