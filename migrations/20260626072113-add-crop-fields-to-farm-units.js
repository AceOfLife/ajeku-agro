// migrations/YYYYMMDDHHMMSS-add-crop-fields-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    const columnsToAdd = [
      { name: 'crop_type', type: Sequelize.STRING, allowNull: true },
      { name: 'crop_description', type: Sequelize.TEXT, allowNull: true },
      { name: 'planting_date', type: Sequelize.DATEONLY, allowNull: true },
      { name: 'expected_harvest_date', type: Sequelize.DATEONLY, allowNull: true },
      { name: 'harvest_cycle_months', type: Sequelize.INTEGER, allowNull: true },
      { name: 'expected_yield_per_unit_kg', type: Sequelize.DECIMAL(10, 2), allowNull: true },
      { name: 'expected_value_per_kg', type: Sequelize.DECIMAL(15, 2), allowNull: true }
    ];

    for (const column of columnsToAdd) {
      if (!tableDescription[column.name]) {
        await queryInterface.addColumn('FarmUnits', column.name, {
          type: column.type,
          allowNull: column.allowNull,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    const columnsToRemove = [
      'crop_type',
      'crop_description',
      'planting_date',
      'expected_harvest_date',
      'harvest_cycle_months',
      'expected_yield_per_unit_kg',
      'expected_value_per_kg'
    ];

    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('FarmUnits', column);
      }
    }
  }
};