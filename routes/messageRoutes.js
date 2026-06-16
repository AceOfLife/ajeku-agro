// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const { authenticate } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig'); // Use your existing multer config

// Send a message (text only or with media) - UPDATED
router.post('/send', authenticate, upload, MessageController.sendMessage);

// Get messages between the authenticated user and another user
router.get('/conversation/:recipientId', authenticate, MessageController.getMessages);

// Get recent chats for the authenticated user
router.get('/recent-chats', authenticate, MessageController.getRecentChats);

// Mark a message as read (only if it belongs to the authenticated user)
router.put('/mark-read/:messageId', authenticate, MessageController.markAsRead);

// Delete message (with media cleanup)
router.delete('/:id', authenticate, MessageController.deleteMessage);

module.exports = router;