// migrations/20250615000003-create-investor-produce-preferences.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM for preference
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_InvestorProducePreferences_preference" AS ENUM('sell', 'take_physical');
    `);

    await queryInterface.createTable('InvestorProducePreferences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      farm_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Farms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      harvest_cycle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'HarvestCycles',
          key: 'id',
        },
        comment: 'NULL means this is the default preference for future cycles',
      },
      preference: {
        type: Sequelize.ENUM('sell', 'take_physical'),
        allowNull: false,
      },
      delivery_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      delivery_region: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Locked after preference_lock_date',
      },
      locked_at: {
        type: Sequelize.DATE,
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

    // Add unique constraint and indexes
    await queryInterface.addIndex('InvestorProducePreferences', ['investor_id', 'farm_id', 'harvest_cycle_id'], {
      unique: true,
      name: 'unique_investor_farm_harvest_preference',
    });
    await queryInterface.addIndex('InvestorProducePreferences', ['investor_id']);
    await queryInterface.addIndex('InvestorProducePreferences', ['farm_id']);
    await queryInterface.addIndex('InvestorProducePreferences', ['harvest_cycle_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InvestorProducePreferences');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_InvestorProducePreferences_preference";`);
  },
};