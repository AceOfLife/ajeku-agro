// migrations/20250621140716-add-farm-valuation-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'farm_valuation', {  // was estimated_value
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Total farm valuation (replaces estimated_value)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'farm_valuation');
  }
};