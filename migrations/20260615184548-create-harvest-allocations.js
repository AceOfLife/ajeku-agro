// migrations/20250615000002-create-harvest-allocations.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUMs for allocation statuses
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestAllocations_preference_used" AS ENUM('sell', 'take_physical');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestAllocations_payout_status" AS ENUM('pending', 'processing', 'paid', 'failed');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestAllocations_delivery_status" AS ENUM('pending', 'dispatched', 'delivered', 'failed');
    `);

    await queryInterface.createTable('HarvestAllocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      harvest_cycle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'HarvestCycles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      investor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Investors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      farm_unit_ownership_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FarmUnitOwnerships',
          key: 'id',
        },
      },
      preference_used: {
        type: Sequelize.ENUM('sell', 'take_physical'),
        allowNull: false,
        comment: 'Which option the investor chose for this harvest',
      },
      allocated_kg: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Kilograms allocated to this investor',
      },
      // For 'sell' investors
      payout_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Gross payout before fees',
      },
      platform_fee_deducted: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      net_payout: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      payout_status: {
        type: Sequelize.ENUM('pending', 'processing', 'paid', 'failed'),
        defaultValue: 'pending',
      },
      payout_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      payout_reference: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Transaction reference for payout',
      },
      // For 'take_physical' investors
      delivery_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      delivery_region: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      delivery_status: {
        type: Sequelize.ENUM('pending', 'dispatched', 'delivered', 'failed'),
        defaultValue: 'pending',
      },
      dispatch_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      tracking_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logistics_cost: {
        type: Sequelize.DECIMAL(15, 2),
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

    // Add indexes for faster queries
    await queryInterface.addIndex('HarvestAllocations', ['harvest_cycle_id']);
    await queryInterface.addIndex('HarvestAllocations', ['investor_id']);
    await queryInterface.addIndex('HarvestAllocations', ['payout_status']);
    await queryInterface.addIndex('HarvestAllocations', ['delivery_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HarvestAllocations');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_HarvestAllocations_preference_used";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_HarvestAllocations_payout_status";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_HarvestAllocations_delivery_status";`);
  },
};