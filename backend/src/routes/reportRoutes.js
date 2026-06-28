const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');

// GET /api/reports/:complaintId/pdf
// Only authenticated users with Admin or Officer roles can export case files as PDF
router.get(
  '/:complaintId/pdf',
  authenticate,
  authorizeRoles('ROLE_ADMIN', 'ROLE_OFFICER'),
  reportController.downloadComplaintPDF
);

module.exports = router;
