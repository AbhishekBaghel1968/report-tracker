const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const adminAuth = require('../middleware/adminAuth');
const citizenAuth = require('../middleware/citizenAuth');
const upload = require('../middleware/upload');

// Public route for tracking status
router.get('/track/:complaintId', complaintController.trackComplaint);

// Citizen specific routes
router.post('/', citizenAuth, upload.single('evidence'), complaintController.submitComplaint);
router.get('/user', citizenAuth, complaintController.getCitizenComplaints);

// Admin dashboard complaints routes
router.get('/admin/stats', adminAuth, complaintController.getAdminStats);
router.get('/', adminAuth, complaintController.getAllComplaints);

// General ID routes
router.get('/:id', adminAuth, complaintController.getComplaintById);
router.put('/:id', adminAuth, complaintController.updateComplaintStatus);
router.delete('/:id', adminAuth, complaintController.deleteComplaint);

module.exports = router;
