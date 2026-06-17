// migrations/20250717163802-add-payment-types-to-transactions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    // Only run if payment_type column doesn't exist
    if (!tableDescription.payment_type) {
      // Check if the ENUM type exists and drop it if it does
      const enumCheck = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_Transactions_payment_type'
      `);
      
      if (enumCheck[0].length > 0) {
        await queryInterface.sequelize.query(`
          DROP TYPE "enum_Transactions_payment_type" CASCADE;
        `);
      }

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
    }
  },

  down: async (queryInterface) => {
    const tableDescription = await queryInterface.describeTable('Transactions');
    if (tableDescription.payment_type) {
      await queryInterface.removeColumn('Transactions', 'payment_type');
    }
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Transactions_payment_type";
    `);
  }
};