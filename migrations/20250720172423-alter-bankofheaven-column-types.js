// migrations/XXXXXXXXXXXXXX-alter-bankofheaven-column-types.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "BankOfHeaven"
      ALTER COLUMN "current_balance" TYPE DECIMAL(15,2),
      ALTER COLUMN "expenses_per_month" TYPE DECIMAL(15,2),
      ALTER COLUMN "income_per_week" TYPE DECIMAL(15,2)
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: You should replace these with the original column types
    await queryInterface.sequelize.query(`
      ALTER TABLE "BankOfHeaven"
      ALTER COLUMN "current_balance" TYPE INTEGER,
      ALTER COLUMN "expenses_per_month" TYPE INTEGER,
      ALTER COLUMN "income_per_week" TYPE INTEGER
    `);
  }
};