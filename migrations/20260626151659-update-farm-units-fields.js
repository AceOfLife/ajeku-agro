// migrations/YYYYMMDDHHMMSS-update-farm-units-fields.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    // Rename size_in_unit to size_of_unit (optional)
    if (tableDescription.size_in_unit) {
      await queryInterface.renameColumn('FarmUnits', 'size_in_unit', 'size_of_unit');
    }

    // Add soil_type column
    if (!tableDescription.soil_type) {
      await queryInterface.addColumn('FarmUnits', 'soil_type', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add image_url column
    if (!tableDescription.image_url) {
      await queryInterface.addColumn('FarmUnits', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add additional fields
    if (!tableDescription.gps_coordinates) {
      await queryInterface.addColumn('FarmUnits', 'gps_coordinates', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'GPS coordinates for this specific unit',
      });
    }

    if (!tableDescription.irrigation_method) {
      await queryInterface.addColumn('FarmUnits', 'irrigation_method', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Irrigation method for this specific unit',
      });
    }

    // Change size_of_unit from DECIMAL to STRING if needed
    if (tableDescription.size_in_unit || tableDescription.size_of_unit) {
      const columnName = tableDescription.size_of_unit ? 'size_of_unit' : 'size_in_unit';
      await queryInterface.changeColumn('FarmUnits', columnName, {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    // Revert rename
    if (tableDescription.size_of_unit) {
      await queryInterface.renameColumn('FarmUnits', 'size_of_unit', 'size_in_unit');
    }

    // Remove added columns
    const columnsToRemove = ['soil_type', 'image_url', 'gps_coordinates', 'irrigation_method'];
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('FarmUnits', column);
      }
    }

    // Revert size column back to DECIMAL
    const columnName = tableDescription.size_of_unit ? 'size_of_unit' : 'size_in_unit';
    await queryInterface.changeColumn('FarmUnits', columnName, {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  }
};