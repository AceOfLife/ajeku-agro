// migrations/20250902093936-create-messages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if ENUM exists before creating - using lowercase name to match error
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_messages_media_type') THEN
          CREATE TYPE "enum_messages_media_type" AS ENUM('image', 'document', 'pdf', 'other');
        END IF;
      END $$;
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
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
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
      media_type: {
        type: "enum_messages_media_type",
        allowNull: true,
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      media_filename: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cloudinary_public_id: {
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
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_messages_media_type";`);
  }
};