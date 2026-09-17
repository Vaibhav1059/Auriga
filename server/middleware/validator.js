/**
 * TiffinFlow — Input Validation Middleware (validator.js)
 * Production-level request body validation and sanitization
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const ALLOWED_ROLES = ['owner', 'cook', 'driver', 'admin'];

/**
 * Validates registration payloads
 */
function validateRegister(req, res, next) {
  const errors = {};
  let { name, email, password, role, phone } = req.body;

  // 1. Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters long.';
  } else if (name.trim().length > 100) {
    errors.name = 'Full name cannot exceed 100 characters.';
  }

  // 2. Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address (e.g. user@example.com).';
  }

  // 3. Password validation
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters.';
  }

  // 4. Role validation
  if (role && !ALLOWED_ROLES.includes(role.toLowerCase())) {
    errors.role = `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}.`;
  }

  // 5. Phone validation (optional)
  if (phone) {
    const cleanPhone = String(phone).replace(/[\s+-]/g, '').slice(-10);
    if (!PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'Phone number must be a valid 10-digit Indian mobile number.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors
    });
  }

  // Sanitize trimmed values
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.role = (role || 'owner').toLowerCase();
  next();
}

/**
 * Validates login payloads
 */
function validateLogin(req, res, next) {
  const errors = {};
  let { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

module.exports = {
  validateRegister,
  validateLogin
};
