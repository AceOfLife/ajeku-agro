// migrations/20250715173315-add-action-url-to-notifications.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('notifications');
    if (!tableDescription.action_url) {
      await queryInterface.addColumn('notifications', 'action_url', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const tableDescription = await queryInterface.describeTable('notifications');
    if (tableDescription.action_url) {
      await queryInterface.removeColumn('notifications', 'action_url');
    }
  }
};