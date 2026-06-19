const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const adminAuth = require('../middleware/adminAuth');

// Secure all analytics routes - only admin can access
router.use(adminAuth);

router.get('/monthly', analyticsController.getMonthly);
router.get('/category', analyticsController.getCategory);
router.get('/status', analyticsController.getStatus);
router.get('/heatmap', analyticsController.getHeatmap);
router.get('/hotspots', analyticsController.getHotspots);

module.exports = router;
