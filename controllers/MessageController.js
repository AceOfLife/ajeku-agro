// controllers/MessageController.js
const { Op } = require('sequelize'); 
const { Message, User, sequelize } = require('../models');
const { uploadMessageMediaToCloudinary, getMediaType } = require('../utils/messageUploader');
const cloudinary = require('../config/cloudinaryConfig');

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.findAll();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages', error });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const newMessage = await Message.create(req.body);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: 'Error creating message', error });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Message.update(req.body, { where: { id } });

    if (updated) {
      const updatedMessage = await Message.findOne({ where: { id } });
      res.status(200).json(updatedMessage);
    } else {
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating message', error });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findOne({ where: { id } });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Delete from Cloudinary if media exists
    if (message.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(message.cloudinary_public_id);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    const deleted = await Message.destroy({ where: { id } });

    if (deleted) {
      res.status(204).json({ message: 'Message deleted' });
    } else {
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { recipient_id, message } = req.body;
    const sender_id = req.user.id;

    if (!recipient_id) {
      return res.status(400).json({ message: "Recipient ID is required." });
    }

    // Check if recipient exists
    const recipient = await User.findByPk(recipient_id);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    const messageData = {
      sender_id,
      recipient_id,
      message: message || '',
      status: 'sent'
    };

    // Handle file upload if files are present
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      try {
        const uploadResult = await uploadMessageMediaToCloudinary(file, 'message_media');
        
        messageData.media_type = getMediaType(file.mimetype);
        messageData.media_url = uploadResult.url;
        messageData.media_filename = file.originalname;
        messageData.cloudinary_public_id = uploadResult.public_id;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading file', 
          error: uploadError.message 
        });
      }
    }

    const newMessage = await Message.create(messageData, {
      attributes: { exclude: ['subject'] } 
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const currentUserId = req.user.id;

    console.log('Current User ID:', currentUserId);
    console.log('Recipient ID:', recipientId);

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, recipient_id: recipientId },
          { sender_id: recipientId, recipient_id: currentUserId },
        ],
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });

    res.status(200).json({ message: 'Messages retrieved successfully', data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({ where: { id: messageId } });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to mark this message as read' });
    }

    await message.update({ status: 'read' });

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
};

exports.getRecentChats = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all unique users that the current user has chatted with
    const chatPartners = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId },
          { recipient_id: currentUserId }
        ]
      },
      attributes: [
        [sequelize.literal(`CASE WHEN sender_id = ${currentUserId} THEN recipient_id ELSE sender_id END`), 'partner_id'],
        [sequelize.fn('MAX', sequelize.col('Message.createdAt')), 'last_message_at']
      ],
      group: ['partner_id'],
      order: [[sequelize.literal('last_message_at'), 'DESC']],
      raw: true
    });

    // Get details for each chat partner and unread count
    const recentChats = await Promise.all(
      chatPartners.map(async (chat) => {
        const partnerId = chat.partner_id;
        
        // Get partner user details
        const partner = await User.findByPk(partnerId, {
          attributes: ['id', 'name', 'profileImage', 'role'],
          raw: true
        });

        if (!partner) return null;

        // Count unread messages from this partner (both sent and received status)
        const unreadCount = await Message.count({
          where: {
            sender_id: partnerId,
            recipient_id: currentUserId,
            status: { [Op.in]: ['sent', 'received'] }
          }
        });

        // Get last message preview
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: currentUserId, recipient_id: partnerId },
              { sender_id: partnerId, recipient_id: currentUserId }
            ]
          },
          order: [['createdAt', 'DESC']],
          attributes: ['message', 'createdAt'],
          raw: true
        });

        return {
          id: partner.id,
          name: partner.name,
          avatar: partner.profileImage,
          role: partner.role,
          unreadCount: unreadCount,
          lastMessage: lastMessage?.message || '',
          lastMessageTime: lastMessage?.createdAt || null
        };
      })
    );

    // Filter out any null results and return
    const filteredChats = recentChats.filter(chat => chat !== null);

    res.status(200).json({
      message: 'Recent chats retrieved successfully',
      data: filteredChats
    });
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    res.status(500).json({ 
      message: 'Error fetching recent chats', 
      error: error.message 
    });
  }
};