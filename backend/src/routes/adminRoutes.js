const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Protect all admin routes using adminAuth middleware
router.use(adminAuth);

router.get('/stats', adminController.getStats);
router.get('/officers', adminController.getOfficers);
router.put('/complaints/:id/assign', adminController.assignComplaint);
router.put('/assign/:complaintId', adminController.assignComplaintById);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
