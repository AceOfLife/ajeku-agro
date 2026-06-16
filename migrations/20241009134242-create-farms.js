// migration: 20241009134242-create-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Farms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      
      // Basic Farm Information
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gps_coordinates: {
        type: Sequelize.STRING,  // Format: "lat,lng"
        allowNull: true,
      },
      
      // Farm Size & Measurement (NEW - from section 4.1)
      measurement_unit: {
        type: Sequelize.STRING,  // "acres", "hectares", "plots", "sq meters"
        allowNull: false,
      },
      total_farm_size: {
        type: Sequelize.DECIMAL(10, 2),  // Total size in measurement_unit
        allowNull: false,
      },
      unit_size: {
        type: Sequelize.DECIMAL(10, 2),  // Size per investable unit (e.g., 1 acre)
        allowNull: false,
      },
      
      // Crop Information (NEW - section 4.1)
      crop_type: {
        type: Sequelize.STRING,  // "Ginger" (primary crop at launch)
        allowNull: false,
      },
      crop_description: {
        type: Sequelize.TEXT,  // Variety, quality, farming method
        allowNull: true,
      },
      supports_multiple_crops: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,  // For Phase 1 - single crop
      },
      
      // Harvest Information (NEW - section 4.1)
      planting_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      expected_harvest_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      harvest_cycle_months: {
        type: Sequelize.INTEGER,  // 9 months for ginger
        allowNull: false,
      },
      harvest_status: {
        type: Sequelize.ENUM('Pre-planting', 'Growing', 'Ready for Harvest', 'Harvested'),
        defaultValue: 'Pre-planting',
        allowNull: false,
      },
      
      // Yield & Financials (NEW - section 4.1)
      expected_yield_per_unit_kg: {
        type: Sequelize.DECIMAL(10, 2),  // Kilograms per investable unit
        allowNull: false,
      },
      expected_value_per_kg: {
        type: Sequelize.DECIMAL(15, 2),  // Estimated market rate at harvest (in Naira)
        allowNull: false,
      },
      
      // Farm Operations (NEW - section 4.1)
      farm_manager: {
        type: Sequelize.STRING,  // Person or organisation operating the farm
        allowNull: false,
      },
      soil_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      irrigation_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      
      // Produce Delivery (NEW - section 4.1)
      physical_delivery_offered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      delivery_regions: {
        type: Sequelize.ARRAY(Sequelize.STRING),  // List of states/regions
        allowNull: true,
      },
      
      // Platform Management (from current platform)
      price_per_unit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      total_units_available: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_units_sold: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      farm_valuation: {
        type: Sequelize.DECIMAL(15, 2),  // Total farm value (NEW - section 3)
        allowNull: true,
      },
      
      // Images & Media (carried forward)
      cover_image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gallery_images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      
      // Installment Settings (carried forward)
      installment_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      
      // Timestamps
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
    await queryInterface.dropTable('Farms');
  },
};