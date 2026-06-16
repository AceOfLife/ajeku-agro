// migrations/20241009134304-create-transactions.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      client_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Investors', // Changed from 'Users' or 'Clients'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      farm_id: {  // ADDED: New column for Agro
        type: Sequelize.INTEGER,
        references: {
          model: 'Farms', // Changed from 'Properties'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Keep property_id for backward compatibility during transition
      property_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      price: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_type: {  // ADDED: New column from updated model
        type: Sequelize.ENUM(
          'full', 'outright', 'fractional', 'fractionalInstallment',
          'installment', 'rental', 'farm_unit', 'farm_installment', 'harvest_payout'
        ),
        allowNull: true,
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      harvest_cycle_id: {  // ADDED: Link to harvest payouts
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'HarvestCycles',
          key: 'id',
        },
      },
      units_purchased: {  // ADDED: For farm unit purchases
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Transactions');
  },
};