// migrations/XXXXXXXXXXXXXX-rename-bankofheaven-expenses-column.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'BankOfHeaven',
      'expenses_per_week',
      'expenses_per_month'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'BankOfHeaven',
      'expenses_per_month',
      'expenses_per_week'
    );
  }
};