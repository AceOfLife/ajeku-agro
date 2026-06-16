// migrations/XXXXXXXXXXXXXX-update-message-foreign-keys.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove the existing foreign key constraints
    await queryInterface.removeConstraint('Messages', 'Messages_sender_id_fkey');
    await queryInterface.removeConstraint('Messages', 'Messages_recipient_id_fkey');

    // Then add new constraints referencing the Users table
    await queryInterface.addConstraint('Messages', {
      fields: ['sender_id'],
      type: 'foreign key',
      name: 'Messages_sender_id_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('Messages', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'Messages_recipient_id_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // For rollback: remove the new constraints and add back the old ones
    await queryInterface.removeConstraint('Messages', 'Messages_sender_id_fkey');
    await queryInterface.removeConstraint('Messages', 'Messages_recipient_id_fkey');

    // Note: You would need to know what the original references were to properly rollback
    // If you had Clients and Agents references before, you'd need to add them back here
    // This is a simplified rollback - you may need to adjust based on your original setup
    await queryInterface.addConstraint('Messages', {
      fields: ['sender_id'],
      type: 'foreign key',
      name: 'Messages_sender_id_fkey',
      references: {
        table: 'Clients', // Assuming original was Clients
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('Messages', {
      fields: ['recipient_id'],
      type: 'foreign key',
      name: 'Messages_recipient_id_fkey',
      references: {
        table: 'Agents', // Assuming original was Agents
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};