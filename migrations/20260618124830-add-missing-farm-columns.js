// migrations/YYYYMMDDHHMMSS-add-missing-farm-columns.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    // Add manager_id if it doesn't exist
    if (!tableDescription.manager_id) {
      await queryInterface.addColumn('Farms', 'manager_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // Add farm_manager if it doesn't exist
    if (!tableDescription.farm_manager) {
      await queryInterface.addColumn('Farms', 'farm_manager', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add gps_coordinates if it doesn't exist
    if (!tableDescription.gps_coordinates) {
      await queryInterface.addColumn('Farms', 'gps_coordinates', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add supports_multiple_crops if it doesn't exist
    if (!tableDescription.supports_multiple_crops) {
      await queryInterface.addColumn('Farms', 'supports_multiple_crops', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }

    // Add crop_description if it doesn't exist
    if (!tableDescription.crop_description) {
      await queryInterface.addColumn('Farms', 'crop_description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Add harvest_cycle_months if it doesn't exist
    if (!tableDescription.harvest_cycle_months) {
      await queryInterface.addColumn('Farms', 'harvest_cycle_months', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Add expected_yield_per_unit_kg if it doesn't exist
    if (!tableDescription.expected_yield_per_unit_kg) {
      await queryInterface.addColumn('Farms', 'expected_yield_per_unit_kg', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    // Add expected_value_per_kg if it doesn't exist
    if (!tableDescription.expected_value_per_kg) {
      await queryInterface.addColumn('Farms', 'expected_value_per_kg', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
    }

    // Add physical_delivery_offered if it doesn't exist
    if (!tableDescription.physical_delivery_offered) {
      await queryInterface.addColumn('Farms', 'physical_delivery_offered', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }

    // Add delivery_regions if it doesn't exist
    if (!tableDescription.delivery_regions) {
      await queryInterface.addColumn('Farms', 'delivery_regions', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      });
    }

    // Add price_per_slot if it doesn't exist
    if (!tableDescription.price_per_slot) {
      await queryInterface.addColumn('Farms', 'price_per_slot', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }

    // Add available_slots if it doesn't exist
    if (!tableDescription.available_slots) {
      await queryInterface.addColumn('Farms', 'available_slots', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns (if needed for rollback)
    const tableDescription = await queryInterface.describeTable('Farms');
    
    const columnsToRemove = [
      'manager_id',
      'farm_manager',
      'gps_coordinates',
      'supports_multiple_crops',
      'crop_description',
      'harvest_cycle_months',
      'expected_yield_per_unit_kg',
      'expected_value_per_kg',
      'physical_delivery_offered',
      'delivery_regions',
      'price_per_slot',
      'available_slots'
    ];

    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('Farms', column);
      }
    }
  }
};