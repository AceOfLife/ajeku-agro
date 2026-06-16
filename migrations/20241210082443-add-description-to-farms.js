// migrations/20241210082443-add-description-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add description to Farms table (was Properties)
    await queryInterface.addColumn('Farms', 'description', {
      type: Sequelize.TEXT,  // Changed to TEXT for longer descriptions
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'description');
  }
};