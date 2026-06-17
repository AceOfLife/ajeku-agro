// migrations/20250804194202-add-full-to-transaction-enum.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if 'full' already exists in the enum
    const enumCheck = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'full' 
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_Transactions_payment_type'
      )
    `);
    
    if (enumCheck[0].length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Transactions_payment_type" 
        ADD VALUE 'full'
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This is a no-op for rollback
  }
};