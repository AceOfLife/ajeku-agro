// migrations/20250615000001-create-harvest-cycles.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM for harvest status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestCycles_status" AS ENUM('upcoming', 'preferences_locked', 'harvested', 'distributing', 'completed');
    `);

    await queryInterface.createTable('HarvestCycles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      cycle_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1st, 2nd, 3rd harvest for this farm',
      },
      harvest_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      preference_lock_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Investors cannot change produce preference after this date',
      },
      actual_yield_kg: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Total actual harvest in kilograms',
      },
      actual_market_price_per_kg: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Market price at harvest time',
      },
      platform_fee_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage deducted from sell proceeds',
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'preferences_locked', 'harvested', 'distributing', 'completed'),
        defaultValue: 'upcoming',
        allowNull: false,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HarvestCycles');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_HarvestCycles_status";`);
  },
};