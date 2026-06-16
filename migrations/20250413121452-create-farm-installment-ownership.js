// migrations/20250413121452-create-farm-installment-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmInstallmentOwnerships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      total_months: {  // ADDED
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      months_paid: {  // ADDED
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {  // ADDED
        type: Sequelize.ENUM('ongoing', 'completed'),
        allowNull: false,
        defaultValue: 'ongoing'
      },
      participates_in_harvest: {  // ADDED - from PDF section 8
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether investor gets harvest proceeds during installment',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmInstallmentOwnerships');
  }
};