// migrations/20260626151659-update-farm-units-fields.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    // Check if size_in_unit exists, if not check for size_of_unit
    let sizeColumnExists = tableDescription.size_in_unit || tableDescription.size_of_unit;
    
    // If neither exists, add size_of_unit
    if (!tableDescription.size_in_unit && !tableDescription.size_of_unit) {
      await queryInterface.addColumn('FarmUnits', 'size_of_unit', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
      });
    } else if (tableDescription.size_in_unit) {
      // Rename size_in_unit to size_of_unit only if it exists
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

    // Add gps_coordinates column
    if (!tableDescription.gps_coordinates) {
      await queryInterface.addColumn('FarmUnits', 'gps_coordinates', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add irrigation_method column
    if (!tableDescription.irrigation_method) {
      await queryInterface.addColumn('FarmUnits', 'irrigation_method', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add physical_delivery_offered column
    if (!tableDescription.physical_delivery_offered) {
      await queryInterface.addColumn('FarmUnits', 'physical_delivery_offered', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Add isInstallment column
    if (!tableDescription.isInstallment) {
      await queryInterface.addColumn('FarmUnits', 'isInstallment', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Add isFractionalInstallment column
    if (!tableDescription.isFractionalInstallment) {
      await queryInterface.addColumn('FarmUnits', 'isFractionalInstallment', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Add isFractionalDuration column
    if (!tableDescription.isFractionalDuration) {
      await queryInterface.addColumn('FarmUnits', 'isFractionalDuration', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Add duration column
    if (!tableDescription.duration) {
      await queryInterface.addColumn('FarmUnits', 'duration', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }

    // Add percentage column
    if (!tableDescription.percentage) {
      await queryInterface.addColumn('FarmUnits', 'percentage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add monthly_expense column
    if (!tableDescription.monthly_expense) {
      await queryInterface.addColumn('FarmUnits', 'monthly_expense', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    // Add is_fractional column
    if (!tableDescription.is_fractional) {
      await queryInterface.addColumn('FarmUnits', 'is_fractional', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // Change size_of_unit from DECIMAL to STRING if needed (only if the column exists and is not already STRING)
    if (tableDescription.size_of_unit) {
      // Check if column is DECIMAL or STRING
      const columnInfo = await queryInterface.sequelize.query(
        `SELECT data_type FROM information_schema.columns WHERE table_name = 'FarmUnits' AND column_name = 'size_of_unit'`
      );
      
      const dataType = columnInfo[0][0]?.data_type;
      
      if (dataType && dataType !== 'character varying') {
        await queryInterface.changeColumn('FarmUnits', 'size_of_unit', {
          type: Sequelize.STRING,
          allowNull: false,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    // Revert rename if size_of_unit exists
    if (tableDescription.size_of_unit) {
      await queryInterface.renameColumn('FarmUnits', 'size_of_unit', 'size_in_unit');
    }

    // Remove added columns
    const columnsToRemove = [
      'soil_type', 
      'image_url', 
      'gps_coordinates', 
      'irrigation_method',
      'physical_delivery_offered',
      'isInstallment',
      'isFractionalInstallment',
      'isFractionalDuration',
      'duration',
      'percentage',
      'monthly_expense',
      'is_fractional'
    ];
    
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('FarmUnits', column);
      }
    }

    // Revert size column back to DECIMAL
    const columnName = tableDescription.size_of_unit ? 'size_of_unit' : 'size_in_unit';
    if (columnName) {
      await queryInterface.changeColumn('FarmUnits', columnName, {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      });
    }
  }
};