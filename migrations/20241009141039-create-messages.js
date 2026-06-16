// migrations/20241009141039-create-messages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM for message status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Messages_status" AS ENUM('sent', 'received', 'read');
    `);

    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // Changed from 'Clients' - messages can be from any user
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // Changed from 'Agents' - messages can go to any user
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('sent', 'received', 'read'),
        allowNull: false,
        defaultValue: 'sent',
      },
      media_type: {  // ADDED: From updated model
        type: Sequelize.ENUM('image', 'document', 'pdf', 'other'),
        allowNull: true,
      },
      media_url: {  // ADDED: From updated model
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Messages');
  },
};