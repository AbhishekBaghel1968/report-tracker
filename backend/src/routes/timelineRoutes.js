const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticate } = require('../middleware/auth');

// GET /api/timeline/:complaintId - Public route to support tracking page
router.get('/:complaintId', timelineController.getTimelineByComplaintId);

// POST /api/timeline - Protected route for manual timeline logging
router.post('/', authenticate, timelineController.createTimelineEntry);

module.exports = router;
