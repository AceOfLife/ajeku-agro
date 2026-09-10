const { Notification, User } = require('../models');
const { Op } = require('sequelize');

// ===== TYPE MAPPING FOR FRONTEND =====
// Maps internal types to what the frontend should display.
// Only applied on READ endpoints. Database stays untouched.
const mapTypeForFrontend = (type) => {
  return type === 'system' ? 'Admin' : type;
};

// Helper: map a single notification's type
const mapNotificationType = (notification) => {
  const plain = notification.toJSON ? notification.toJSON() : notification;
  return {
    ...plain,
    type: mapTypeForFrontend(plain.type)
  };
};

// Helper: map an array of notifications
const mapNotificationsType = (notifications) => {
  return notifications.map(mapNotificationType);
};

// ===== CONTROLLER FUNCTIONS =====

// Improved create notification with more options
// ⚠️ NO mapping here — this is a WRITE endpoint
exports.createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, related_entity_id, metadata, action_url } = req.body;

    if (!user_id || !title || !message || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const notification = await Notification.create({
      user_id,
      title,
      message,
      type,
      related_entity_id,
      metadata,
      action_url,
      is_read: false
    });

    // REAL-TIME: Emit to Socket.io (if available)
    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${user_id}`).emit('new_notification', {
        event: type,
        data: notification
      });
      console.log(`Real-time notification sent to user ${user_id}`);
    }

    return res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Create Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// ✅ READ endpoint — mapping applied
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    // ✅ Map 'system' → 'Admin' for frontend
    const mappedRows = mapNotificationsType(rows);

    res.json({
      success: true,
      data: {
        notifications: mappedRows,
        unread_count: unreadCount
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      meta: {
        message: count === 0 ? 'No notifications found' : 'Notifications loaded',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications'
    });
  }
};

// Mark single notification as read — NOT mapped (write endpoint)
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ is_read: true });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error("Mark as Read Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
};

// Mark all notifications as read — NOT mapped (write endpoint)
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error("Mark All as Read Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications'
    });
  }
};

// Delete notification — NOT mapped (write endpoint)
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// ✅ READ endpoint — SSE stream, mapping applied
exports.notificationStream = async (req, res) => {
  try {
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('event: connected\ndata: SSE connection established\n\n');

    const intervalId = setInterval(async () => {
      try {
        const unreadNotifications = await Notification.findAll({
          where: {
            user_id: userId,
            is_read: false,
            created_at: { [Op.gt]: new Date(Date.now() - 30000) }
          },
          limit: 5,
          order: [['created_at', 'DESC']]
        });

        if (unreadNotifications.length > 0) {
          // ✅ Map 'system' → 'Admin' for frontend
          const mapped = mapNotificationsType(unreadNotifications);
          res.write(`data: ${JSON.stringify(mapped)}\n\n`);
        }
      } catch (error) {
        console.error('SSE Polling Error:', error);
      }
    }, 5000);

    req.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });

  } catch (error) {
    console.error('SSE Connection Error:', error);
    res.status(500).json({ message: 'SSE connection failed' });
  }
};

// ✅ READ endpoint — mapping applied
exports.getUserNotificationsById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'client' && parseInt(user_id) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view these notifications'
      });
    }

    const where = { user_id };

    if (userRole === 'admin' && parseInt(user_id) !== currentUserId) {
      const notifications = await Notification.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }],
        order: [['created_at', 'DESC']]
      });

      // ✅ Map 'system' → 'Admin' for frontend
      const mapped = mapNotificationsType(notifications);

      return res.status(200).json({
        success: true,
        data: mapped,
        meta: {
          access_level: 'admin_view',
          user_id: parseInt(user_id),
          timestamp: new Date().toISOString()
        }
      });
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    // ✅ Map 'system' → 'Admin' for frontend
    const mapped = mapNotificationsType(notifications);

    res.status(200).json({
      success: true,
      data: mapped,
      meta: {
        access_level: 'owner_view',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Get User Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};