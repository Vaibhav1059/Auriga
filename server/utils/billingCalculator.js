/**
 * Enterprise Billing Calculator for TiffinFlow
 * Implements weekday/6-day delivery rules, 9:00 AM same-day cutoff, and GST tax invoicing.
 */

function isDeliveryDay(dateObj, daysPerWeek = 5) {
  const day = dateObj.getDay();
  if (daysPerWeek === 6) {
    return day !== 0; // Monday through Saturday (Sunday off)
  }
  return day !== 0 && day !== 6; // Standard 5-day Mon-Fri (Sat & Sun off)
}

function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a same-day pause request has passed the strict 9:00 AM IST cutoff.
 */
function evaluateSameDayCutoff(requestedStartDate, currentTime = new Date()) {
  const todayStr = formatDate(currentTime);
  if (requestedStartDate === todayStr) {
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    const isPastCutoff = currentHour > 9 || (currentHour === 9 && currentMin > 0);
    return {
      isSameDay: true,
      isPastCutoff,
      cutoffTime: '09:00 AM IST',
      message: isPastCutoff 
        ? 'Request passed 9:00 AM cutoff. Same-day lunch is already cooking. Pause will begin tomorrow.'
        : 'Pause accepted before 9:00 AM cutoff. Same-day lunch canceled.'
    };
  }
  return { isSameDay: false, isPastCutoff: false, message: 'Future date pause accepted.' };
}

/**
 * Calculates pro-rated month-end bill with GST breakdown and HSN/SAC code 996331.
 */
function calculateProratedBill({ 
  monthlyPrice, 
  billingMonth, 
  startDate, 
  pauseLogs = [], 
  daysPerWeek = 5,
  includeGst = true 
}) {
  const [yearStr, monthStr] = billingMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();

  let totalDeliveryDaysInMonth = 0;
  let activeDeliveryDays = 0;
  let pausedDeliveryDays = 0;
  let beforeStartDays = 0;
  const itemizedDays = [];

  const subStartDateStr = startDate || `${yearStr}-${monthStr}-01`;

  // First pass: Count total delivery days in the month
  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month - 1, d);
    if (isDeliveryDay(current, daysPerWeek)) {
      totalDeliveryDaysInMonth++;
    }
  }

  // Daily rate
  const dailyRate = totalDeliveryDaysInMonth > 0 ? (monthlyPrice / totalDeliveryDaysInMonth) : 0;

  // Second pass: Categorize each day
  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month - 1, d);
    const dateStr = formatDate(current);
    const deliveryDay = isDeliveryDay(current, daysPerWeek);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });

    let status = 'DELIVERED';
    let charge = dailyRate;
    let reason = null;

    if (!deliveryDay) {
      status = 'WEEKEND';
      charge = 0;
    } else if (dateStr < subStartDateStr) {
      status = 'NOT_STARTED';
      charge = 0;
      beforeStartDays++;
    } else {
      const activePause = pauseLogs.find(p => dateStr >= p.start_date && dateStr <= p.end_date);

      if (activePause) {
        status = 'PAUSED';
        charge = 0;
        reason = activePause.reason || 'Leave requested';
        pausedDeliveryDays++;
      } else {
        status = 'DELIVERED';
        charge = dailyRate;
        activeDeliveryDays++;
      }
    }

    itemizedDays.push({
      date: dateStr,
      day: d,
      dayName,
      isDeliveryDay: deliveryDay,
      status,
      charge: parseFloat(charge.toFixed(2)),
      reason
    });
  }

  const taxableAmount = parseFloat((activeDeliveryDays * dailyRate).toFixed(2));
  const fullMonthSavings = parseFloat((pausedDeliveryDays * dailyRate).toFixed(2));

  // GST 5% (2.5% CGST + 2.5% SGST) for outdoor catering / tiffin services
  const cgstRate = 0.025;
  const sgstRate = 0.025;
  const cgst = includeGst ? parseFloat((taxableAmount * cgstRate).toFixed(2)) : 0;
  const sgst = includeGst ? parseFloat((taxableAmount * sgstRate).toFixed(2)) : 0;
  const totalWithGst = parseFloat((taxableAmount + cgst + sgst).toFixed(2));

  return {
    billingMonth,
    monthlyPrice: parseFloat(monthlyPrice.toFixed(2)),
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    daysPerWeek,
    totalWeekdaysInMonth: totalDeliveryDaysInMonth,
    deliveredDays: activeDeliveryDays,
    pausedDays: pausedDeliveryDays,
    beforeStartDays,
    taxableAmount,
    cgst,
    sgst,
    gstRatePercent: 5.0,
    hsnSacCode: '996331',
    finalAmount: totalWithGst,
    savingsForCustomer: fullMonthSavings,
    itemizedDays
  };
}

function getTodayISTString(date = new Date()) {
  return formatDate(date);
}

function isPastCutoff(time = new Date()) {
  const currentHour = time.getHours();
  const currentMin = time.getMinutes();
  return currentHour > 9 || (currentHour === 9 && currentMin > 0);
}

module.exports = {
  isDeliveryDay,
  isWeekday: (d) => isDeliveryDay(d, 5),
  formatDate,
  getTodayISTString,
  isPastCutoff,
  evaluateSameDayCutoff,
  calculateProratedBill
};
