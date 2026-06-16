// migrations/20250715172113-create-notifications-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM with farm-specific types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_notifications_type" AS ENUM(
        'property',
        'farm',
        'harvest',
        'transaction',
        'message',
        'system',
        'payment',
        'admin_alert',
        'user_signup',
        'produce_preference'
      );
    `);

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: '"enum_notifications_type"',
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      related_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      action_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_notifications_type";`);
  }
};