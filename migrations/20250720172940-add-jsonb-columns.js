// migrations/XXXXXXXXXXXXXX-add-jsonb-columns.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'BankOfHeaven',
      'previous_month_data',
      {
        type: Sequelize.JSONB,
        defaultValue: {}
      }
    );
    await queryInterface.addColumn(
      'BankOfHeaven',
      'percentage_changes',
      {
        type: Sequelize.JSONB,
        defaultValue: {}
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('BankOfHeaven', 'previous_month_data');
    await queryInterface.removeColumn('BankOfHeaven', 'percentage_changes');
  }
};