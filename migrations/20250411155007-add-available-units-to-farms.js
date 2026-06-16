// migrations/20250411155007-add-available-units-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'available_units', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Units still available for purchase (replaces available_slots)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'available_units');
  }
};