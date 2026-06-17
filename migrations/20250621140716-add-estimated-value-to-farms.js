// migrations/20250621140716-add-farm-valuation-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (!tableDescription.farm_valuation) {
      await queryInterface.addColumn('Farms', 'farm_valuation', {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Total farm valuation (replaces estimated_value)',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (tableDescription.farm_valuation) {
      await queryInterface.removeColumn('Farms', 'farm_valuation');
    }
  }
};