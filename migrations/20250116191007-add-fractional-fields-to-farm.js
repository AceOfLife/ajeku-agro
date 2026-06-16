// migrations/20250116191007-add-fractional-fields-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding fractional fields to 'Farms' table (was Properties)
    await queryInterface.addColumn('Farms', 'total_units_available', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Total investable units available (replaces fractional_slots)',
    });

    await queryInterface.addColumn('Farms', 'available_units', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Units still available for purchase (replaces available_slots)',
    });

    await queryInterface.addColumn('Farms', 'price_per_unit', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: 'Price per investable unit (replaces price_per_slot)',
    });

    // Keep old column names for backward compatibility during transition
    await queryInterface.addColumn('Farms', 'fractional_slots', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'DEPRECATED - use total_units_available instead',
    });

    await queryInterface.addColumn('Farms', 'price_per_slot', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: 'DEPRECATED - use price_per_unit instead',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'total_units_available');
    await queryInterface.removeColumn('Farms', 'available_units');
    await queryInterface.removeColumn('Farms', 'price_per_unit');
    await queryInterface.removeColumn('Farms', 'fractional_slots');
    await queryInterface.removeColumn('Farms', 'price_per_slot');
  }
};