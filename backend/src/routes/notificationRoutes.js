const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate); // Require authentication for all notification routes

// Core CRUD APIs
router.get('/', notificationController.getUserNotifications);

// Read notifications (support both /read/:id and /:id/read for compatibility)
router.put('/read/:id', notificationController.markAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

// Archive notifications
router.put('/archive/:id', notificationController.archiveNotification);
router.put('/:id/archive', notificationController.archiveNotification);

// Delete/Clear alerts
router.delete('/clear-all', notificationController.clearNotifications);
router.delete('/:id', notificationController.deleteNotification);

// Admin broadcasts (Admin role required)
router.post('/broadcast', isAdmin, notificationController.broadcastNotification);

module.exports = router;
