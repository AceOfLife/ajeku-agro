module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Transactions_payment_type" 
      ADD VALUE 'full' AFTER 'rental'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM pg_enum 
      WHERE enumlabel = 'full' 
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_Transactions_payment_type'
      )
    `);
  }
};