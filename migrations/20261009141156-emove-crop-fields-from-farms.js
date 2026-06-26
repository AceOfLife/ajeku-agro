// migrations/YYYYMMDDHHMMSS-remove-crop-fields-from-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    const columnsToRemove = [
      'crop_type',
      'crop_description',
      'supports_multiple_crops',
      'planting_date',
      'expected_harvest_date',
      'harvest_cycle_months',
      'expected_yield_per_unit_kg',
      'expected_value_per_kg',
      'unit_size',
      'price_per_unit',
      'total_units_available',
      'available_units',
      'price_per_slot',
      'fractional_slots',
      'available_slots'
    ];

    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('Farms', column);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'crop_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'crop_description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'supports_multiple_crops', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('Farms', 'planting_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'expected_harvest_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'harvest_cycle_months', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'expected_yield_per_unit_kg', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'expected_value_per_kg', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'unit_size', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'price_per_unit', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'total_units_available', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'available_units', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'price_per_slot', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'fractional_slots', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Farms', 'available_slots', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};