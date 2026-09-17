/**
 * TiffinFlow — Authentication Controller (authController.js)
 * Clean Controller Layer for User Registration, Login & Role Permissions
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');

/**
 * Handle new user / kitchen staff registration
 */
function register(req, res) {
  const { name, email, password, role } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({
        error: 'Conflict: Account already exists',
        message: 'An account with this email address already exists. Please login instead.'
      });
    }

    // Default tenant ID is 1 (Vaibhav Annapurna Tiffin Kitchens)
    const tenantId = 1;
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userRole = role || 'owner';

    const result = db.prepare(`
      INSERT INTO users (tenant_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(tenantId, name.trim(), email.toLowerCase().trim(), password_hash, userRole);

    const user = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: userRole,
      tenant_id: tenantId
    };

    const token = jwt.sign(user, config.JWT_SECRET, { expiresIn: '7d' });

    // Record audit event
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, user.name, user.role, 'USER_REGISTERED', 'USER', user.id, `New ${userRole} account registered: ${user.email}`, req.ip || '127.0.0.1');

    return res.status(201).json({
      message: 'Registration successful! Account created.',
      token,
      user
    });
  } catch (err) {
    console.error('[Auth Controller] Register error:', err);
    return res.status(500).json({ error: 'Internal server error during user registration.' });
  }
}

/**
 * Handle user / staff login
 */
function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No registered user found with this email address.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password entered.'
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id
    };

    const token = jwt.sign(userPayload, config.JWT_SECRET, { expiresIn: '7d' });

    // Record audit event
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.tenant_id || 1, user.name, user.role, 'USER_LOGIN', 'USER', user.id, `User signed in successfully: ${user.email}`, req.ip || '127.0.0.1');

    return res.status(200).json({
      message: 'Login successful! Welcome back.',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[Auth Controller] Login error:', err);
    return res.status(500).json({ error: 'Internal server error during user login.' });
  }
}

/**
 * Get current authenticated user profile
 */
function getProfile(req, res) {
  try {
    const user = db.prepare('SELECT id, tenant_id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const tenant = db.prepare('SELECT id, name, gstin, phone, address FROM tenants WHERE id = ?').get(user.tenant_id || 1);

    return res.status(200).json({
      user,
      tenant
    });
  } catch (err) {
    console.error('[Auth Controller] Profile error:', err);
    return res.status(500).json({ error: 'Internal server error fetching user profile.' });
  }
}

/**
 * Get pre-seeded candidate demo accounts
 */
function getDemoAccounts(req, res) {
  return res.status(200).json({
    accounts: [
      { role: 'owner', name: 'Chef Rajesh Sharma', email: 'admin@tiffinflow.com', password: 'admin123', description: 'Full owner privileges' },
      { role: 'cook', name: 'Ramu Maharaj (Head Cook)', email: 'cook@tiffinflow.com', password: 'admin123', description: 'Kitchen dispatch & KDS prep display' },
      { role: 'driver', name: 'Mukesh Saini (Lead Driver)', email: 'driver@tiffinflow.com', password: 'admin123', description: 'Driver delivery manifest & route maps' }
    ]
  });
}

module.exports = {
  register,
  login,
  getProfile,
  getDemoAccounts
};
