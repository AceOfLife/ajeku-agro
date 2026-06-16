// migrations/20250621135341-add-monthly-expense-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'monthly_expense', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Monthly operational expenses for the farm',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'monthly_expense');
  }
};