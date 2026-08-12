// migrations/XXXXXXXXXXXXXX-remove-transaction-id-from-farm-unit-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before removing
    const tableInfo = await queryInterface.describeTable('FarmUnitOwnerships');
    if (tableInfo.transaction_id) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'transaction_id');
      console.log('✅ Removed transaction_id column from FarmUnitOwnerships');
    } else {
      console.log('ℹ️ transaction_id column does not exist, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: add the column back if needed
    await queryInterface.addColumn('FarmUnitOwnerships', 'transaction_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Transactions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    console.log('⬆️ Added transaction_id column back to FarmUnitOwnerships');
  }
};