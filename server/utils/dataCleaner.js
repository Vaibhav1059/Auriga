/**
 * Data Cleaning & Normalization Engine for TiffinFlow
 * Level 3 — T4 (messy data):
 * Handles duplicate phones, mixed date formats, and blank/corrupt records.
 */

/**
 * Standardizes raw phone strings to a canonical 10-digit format.
 * Strips whitespace, hyphens, parentheses, plus signs, and country codes (+91, 0).
 */
function cleanPhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string' && typeof rawPhone !== 'number') {
    return null;
  }

  const digits = String(rawPhone).replace(/\D/g, '');

  if (digits.length === 10) {
    return digits;
  }
  // If 11 digits starting with 0 (e.g. 09829012345)
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // If 12 digits starting with 91 (e.g. 919829012345 or +91...)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // Check if last 10 digits look like a valid Indian mobile number (starts with 6, 7, 8, 9)
  if (digits.length > 10) {
    const candidate = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parses mixed date formats into canonical YYYY-MM-DD.
 * Handles:
 * - ISO: 2026-09-01
 * - Indian/UK: 01/09/2026, 01-09-2026
 * - US: 09/01/2026
 * - Textual: 1-Sep-2026, 15 September 2026, 14th Sept 2026
 * - Millisecond timestamps
 */
function normalizeDate(rawDate) {
  if (!rawDate) return null;

  // If numeric timestamp
  if (typeof rawDate === 'number' || (/^\d{10,13}$/.test(String(rawDate).trim()))) {
    const num = Number(rawDate);
    const d = new Date(num > 1e11 ? num : num * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 1. Standard ISO: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = String(isoMatch[2]).padStart(2, '0');
    const day = String(isoMatch[3]).padStart(2, '0');
    if (isValidCalendarDate(year, Number(month), Number(day))) {
      return `${year}-${month}-${day}`;
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    // If day > 12, it's definitely DD-MM-YYYY
    if (day > 12 && month <= 12) {
      if (isValidCalendarDate(year, month, day)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // Default assumption for Indian tiffin services: DD/MM/YYYY
    if (month <= 12 && day <= 31) {
      if (isValidCalendarDate(year, month, day)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // 3. Textual dates like "14-Sep-2026", "14th September 2026", "Sep 14, 2026"
  const cleanText = str.replace(/(st|nd|rd|th),?/gi, '');
  const parsed = new Date(cleanText);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y >= 2000 && y <= 2050) {
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

function isValidCalendarDate(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
}

/**
 * Validates and cleans a raw imported customer record.
 */
function cleanCustomerRecord(record) {
  // Check for completely empty record
  if (!record || typeof record !== 'object') {
    return { isValid: false, reason: 'Empty or corrupt record object' };
  }

  // 1. Name validation
  const name = record.name || record.customer_name || record.fullName;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { isValid: false, reason: 'Missing or blank customer name' };
  }

  // 2. Phone validation
  const rawPhone = record.phone || record.phone_number || record.mobile || record.contact;
  const cleanPhone = cleanPhoneNumber(rawPhone);
  if (!cleanPhone) {
    return { isValid: false, reason: `Invalid or missing phone number: "${rawPhone || 'blank'}"` };
  }

  // 3. Date validation
  const rawDate = record.start_date || record.startDate || record.date || record.joining_date;
  const cleanDate = rawDate ? normalizeDate(rawDate) : new Date().toISOString().split('T')[0];
  if (!cleanDate) {
    return { isValid: false, reason: `Unparseable start date format: "${rawDate}"` };
  }

  return {
    isValid: true,
    cleaned: {
      name: name.trim(),
      phone: cleanPhone,
      email: (record.email || '').trim(),
      address: (record.address || 'Jaipur').trim(),
      locality: (record.locality || 'Malviya Nagar').trim(),
      dietary_notes: (record.dietary_notes || record.notes || '').trim(),
      plan_id: parseInt(record.plan_id, 10) || 1,
      start_date: cleanDate
    }
  };
}

module.exports = {
  cleanPhoneNumber,
  normalizeDate,
  cleanCustomerRecord
};
