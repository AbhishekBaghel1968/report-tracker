const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for tracking status
router.get('/track/:complaintId', complaintController.trackComplaint);

// Authenticated specific routes
router.post('/', authenticate, upload.single('evidence'), complaintController.submitComplaint);
router.get('/user', authenticate, complaintController.getCitizenComplaints);

// Admin specific routes
router.get('/admin/stats', authenticate, isAdmin, complaintController.getAdminStats);
router.get('/', authenticate, isAdmin, complaintController.getAllComplaints);

// General ID routes
router.get('/:id', authenticate, complaintController.getComplaintById);
router.put('/:id', authenticate, isAdmin, complaintController.updateComplaintStatus);
router.delete('/:id', authenticate, isAdmin, complaintController.deleteComplaint);

module.exports = router;
