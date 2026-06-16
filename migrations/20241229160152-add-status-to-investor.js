// migrations/20241229160152-add-status-to-investor.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Investors', 'status', {
      type: Sequelize.ENUM('Unverified', 'Verified'),
      defaultValue: 'Unverified',
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Investors', 'status');
  }
};