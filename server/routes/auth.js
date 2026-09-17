/**
 * TiffinFlow — Authentication Routes (auth.js)
 * Endpoints for User Registration, Login, Session Management, and Role Authorization
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register - Register new kitchen owner, cook, or driver with strict validation
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Authenticate registered kitchen staff with credentials validation
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - Retrieve current authenticated staff profile & tenant info (JWT protected)
router.get('/me', authMiddleware, authController.getProfile);

// GET /api/auth/demo-accounts - Helper for evaluation and candidate testing
router.get('/demo-accounts', authController.getDemoAccounts);

module.exports = router;
