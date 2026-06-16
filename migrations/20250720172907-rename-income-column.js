// migrations/XXXXXXXXXXXXXX-rename-income-column.js
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      'BankOfHeaven',
      'income_per_week',
      'income_per_month'
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      'BankOfHeaven',
      'income_per_month',
      'income_per_week'
    );
  }
};