const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geoController');
const adminAuth = require('../middleware/adminAuth');

// SECURE: Get complaint geo heatmap logs (requires admin authentication)
router.get('/geo-analytics', adminAuth, geoController.getGeoAnalytics);

module.exports = router;
