// migrations/20250111153502-add-is-fractional-and-share-percentage-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding 'is_fractional' column to 'Farms' table (was Properties)
    await queryInterface.addColumn('Farms', 'is_fractional', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,  // Farms are inherently fractional
      allowNull: false,
    });

    // Adding 'share_percentage' column to 'Farms' table
    await queryInterface.addColumn('Farms', 'share_percentage', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'is_fractional');
    await queryInterface.removeColumn('Farms', 'share_percentage');
  }
};