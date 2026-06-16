const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/authMiddleware'); 

// SSE Stream
router.get('/stream', authenticate, notificationController.notificationStream);

// Create notification (protected, typically admin/agent only)
router.post('/', authenticate, notificationController.createNotification);

// Get user notifications
router.get('/', authenticate, notificationController.getUserNotifications);

// Mark as read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification);
// Get User notifications
router.get('/user/:user_id', authenticate, notificationController.getUserNotificationsById);
module.exports = router;