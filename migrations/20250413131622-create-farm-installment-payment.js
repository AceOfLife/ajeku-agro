// migrations/20250413131622-create-farm-installment-payments.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmInstallmentPayments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ownership_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'FarmInstallmentOwnerships', key: 'id' },  // was InstallmentOwnerships
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      farm_id: {  // was property_id
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Farms', key: 'id' },  // was Properties
        onDelete: 'CASCADE'
      },
      amount_paid: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      payment_month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      payment_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      payment_date: {  // ADDED
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      payment_reference: {  // ADDED
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmInstallmentPayments');
  }
};