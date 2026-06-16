// migrations/20250717163802-add-payment-types-to-transactions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Transactions_payment_type";
    `);

    // Create updated ENUM with farm payment types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Transactions_payment_type" AS ENUM (
        'full',
        'outright',
        'fractional',
        'fractionalInstallment',
        'installment',
        'rental',
        'farm_unit',
        'farm_installment',
        'harvest_payout'
      );
    `);

    await queryInterface.addColumn('Transactions', 'payment_type', {
      type: '"enum_Transactions_payment_type"',
      allowNull: false,
      defaultValue: 'fractional'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Transactions', 'payment_type');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Transactions_payment_type";
    `);
  }
};