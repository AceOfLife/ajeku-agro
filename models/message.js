// models/message.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sent', 'received', 'read'),
      allowNull: false,
      defaultValue: 'sent',
    },
    media_type: {
      type: DataTypes.ENUM('image', 'document', 'pdf', 'other'),
      allowNull: true,
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    media_filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cloudinary_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'Messages',
  });

  Message.associate = function(models) {
    Message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
    });
    Message.belongsTo(models.User, {
      foreignKey: 'recipient_id',
      as: 'recipient',
    });
  };

  return Message;
};