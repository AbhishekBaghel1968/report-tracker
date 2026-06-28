const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

/**
 * Authorization guard: Limits access to Administrators and Cyber Officers.
 */
function authorizedRoles(req, res, next) {
  if (req.user && (req.user.role === 'ROLE_ADMIN' || req.user.role === 'ROLE_OFFICER')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Access restricted to Officers and Administrators.' });
}

// POST /api/ai/analyze
router.post('/analyze', authenticate, authorizedRoles, aiController.analyzeComplaint);

module.exports = router;
