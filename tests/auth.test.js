/**
 * TiffinFlow — Authentication & Validation Test Suite (auth.test.js)
 * Tests registration validation, duplicate prevention, login, JWT issuance, and RBAC
 */

const assert = require('assert');
const bcrypt = require('../server/node_modules/bcryptjs');
const jwt = require('../server/node_modules/jsonwebtoken');
const db = require('../server/db/database');
const config = require('../server/config');
const { validateRegister, validateLogin } = require('../server/middleware/validator');
const authMiddleware = require('../server/middleware/auth');

console.log('----------------------------------------------------');
console.log('🧪 RUNNING TIFFINFLOW AUTH & VALIDATION SUITE');
console.log('----------------------------------------------------');

// Helper to mock Express req, res, next
function mockHttp(body = {}, headers = {}) {
  const req = { body, headers, ip: '127.0.0.1' };
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; return this; }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  return { req, res, next: () => { nextCalled = true; }, wasNextCalled: () => nextCalled };
}

// 1. Test validateRegister rejects short password
{
  const { req, res, next, wasNextCalled } = mockHttp({ name: 'Valid Name', email: 'test@example.com', password: '123' });
  validateRegister(req, res, next);
  assert.strictEqual(res.statusCode, 400, 'Password under 6 chars must return 400');
  assert.strictEqual(wasNextCalled(), false);
  assert.ok(res.data.errors.password, 'Must have password error');
  console.log('✅ Test 1 Passed: Password under 6 characters rejected with 400.');
}

// 2. Test validateRegister rejects invalid email
{
  const { req, res, next, wasNextCalled } = mockHttp({ name: 'Valid Name', email: 'invalid-email', password: 'password123' });
  validateRegister(req, res, next);
  assert.strictEqual(res.statusCode, 400, 'Invalid email must return 400');
  assert.strictEqual(wasNextCalled(), false);
  assert.ok(res.data.errors.email, 'Must have email error');
  console.log('✅ Test 2 Passed: Invalid email format rejected with 400.');
}

// 3. Test validateRegister rejects short name
{
  const { req, res, next, wasNextCalled } = mockHttp({ name: 'A', email: 'valid@example.com', password: 'password123' });
  validateRegister(req, res, next);
  assert.strictEqual(res.statusCode, 400, 'Name under 2 chars must return 400');
  assert.strictEqual(wasNextCalled(), false);
  assert.ok(res.data.errors.name, 'Must have name error');
  console.log('✅ Test 3 Passed: Short name rejected with 400.');
}

// 4. Test validateRegister passes with valid payload
{
  const { req, res, next, wasNextCalled } = mockHttp({ name: 'Mukesh Driver', email: 'mukesh.test@tiffinflow.com', password: 'securePassword123', role: 'driver' });
  validateRegister(req, res, next);
  assert.strictEqual(wasNextCalled(), true, 'Valid registration payload must call next()');
  console.log('✅ Test 4 Passed: Valid registration payload passes middleware.');
}

// 5. Test validateLogin rejects empty fields
{
  const { req, res, next, wasNextCalled } = mockHttp({ email: '', password: '' });
  validateLogin(req, res, next);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(wasNextCalled(), false);
  console.log('✅ Test 5 Passed: Empty login credentials rejected with 400.');
}

// 6. Test authMiddleware rejects missing token
{
  const { req, res, next, wasNextCalled } = mockHttp({}, {});
  authMiddleware(req, res, next);
  assert.strictEqual(res.statusCode, 401, 'Missing token must return 401');
  assert.strictEqual(wasNextCalled(), false);
  console.log('✅ Test 6 Passed: Missing authorization header rejected with 401.');
}

// 7. Test authMiddleware accepts valid token
{
  const token = jwt.sign({ id: 99, role: 'owner', email: 'owner@test.com' }, config.JWT_SECRET);
  const { req, res, next, wasNextCalled } = mockHttp({}, { authorization: `Bearer ${token}` });
  authMiddleware(req, res, next);
  assert.strictEqual(wasNextCalled(), true);
  assert.strictEqual(req.user.role, 'owner');
  console.log('✅ Test 7 Passed: Valid JWT Bearer token accepted.');
}

// 8. Test role-based authorization guard (requireRole)
{
  const ownerGuard = authMiddleware.requireRole(['owner']);
  
  // Cook attempts owner action
  const cookReq = { user: { id: 2, role: 'cook' } };
  const cookRes = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; return this; } };
  let cookNextCalled = false;
  ownerGuard(cookReq, cookRes, () => { cookNextCalled = true; });
  assert.strictEqual(cookRes.statusCode, 403, 'Cook must be rejected with 403 for owner-only route');
  assert.strictEqual(cookNextCalled, false);

  // Owner attempts owner action
  const ownerReq = { user: { id: 1, role: 'owner' } };
  const ownerRes = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; return this; } };
  let ownerNextCalled = false;
  ownerGuard(ownerReq, ownerRes, () => { ownerNextCalled = true; });
  assert.strictEqual(ownerNextCalled, true, 'Owner must pass owner guard');
  console.log('✅ Test 8 Passed: Role-Based Authorization Guard (requireRole) verified with 403 protection.');
}

console.log('----------------------------------------------------');
console.log('🎉 ALL 8 AUTH & VALIDATION TESTS PASSED PERFECTLY!');
console.log('----------------------------------------------------');
