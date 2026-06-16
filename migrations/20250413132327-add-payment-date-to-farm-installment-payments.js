// migrations/20250413132327-add-payment-date-to-farm-installment-payments.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('FarmInstallmentPayments', 'payment_date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('FarmInstallmentPayments', 'payment_date');
  }
};