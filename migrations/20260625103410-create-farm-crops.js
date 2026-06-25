// migrations/YYYYMMDDHHMMSS-create-farm-crops.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmCrops', {
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
      crop_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      crop_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      area_allocated: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      planting_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      expected_harvest_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      harvest_cycle_months: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expected_yield_per_unit_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      expected_value_per_kg: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Add index for faster queries
    await queryInterface.addIndex('FarmCrops', ['farm_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmCrops');
  },
};