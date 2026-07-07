// migrations/YYYYMMDDHHMMSS-add-refresh-token-to-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.refresh_token) {
      await queryInterface.addColumn('Users', 'refresh_token', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.refresh_token) {
      await queryInterface.removeColumn('Users', 'refresh_token');
    }
  }
};