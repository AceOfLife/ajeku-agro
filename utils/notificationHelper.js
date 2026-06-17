// utils/notificationHelper.js
const { Notification, User } = require('../models');

class NotificationHelper {
  static async createNotification({
    userId,
    title,
    message,
    type,
    relatedEntityId = null,
    metadata = null,
    actionUrl = null
  }, transaction = null) {
    try {
      console.log('Creating notification:', { userId, title });
      
      const options = {};
      if (transaction) options.transaction = transaction;

      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type,
        related_entity_id: relatedEntityId,
        metadata,
        action_url: actionUrl,
        is_read: false
      }, options);

      console.log('Notification created:', notification.id);
      return notification;

    } catch (error) {
      console.error('Notification creation failed:', {
        error: error.message,
        stack: error.stack,
        input: { userId, title }
      });
      throw error;
    }
  }

  static async notifyAdmins({
    title,
    message,
    type,
    relatedEntityId,
    metadata
  }, transaction = null) {
    try {
      console.log('Notifying admins:', { title });

      const options = {};
      if (transaction) options.transaction = transaction;

      const admins = await User.findAll({ 
        where: { role: 'admin' },
        ...options
      });

      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title,
        message,
        type,
        related_entity_id: relatedEntityId,
        metadata,
        is_read: false
      }));

      const results = await Notification.bulkCreate(notifications, options);
      console.log(`Created ${results.length} admin notifications`);
      return results;

    } catch (error) {
      console.error('Admin notification failed:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = NotificationHelper;