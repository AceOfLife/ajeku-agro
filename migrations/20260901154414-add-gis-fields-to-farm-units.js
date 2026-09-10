// migrations/XXXXXXXXXXXXXX-add-gis-fields-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('FarmUnits');
    
    // Add GIS fields
    if (!tableInfo.latitude) {
      await queryInterface.addColumn('FarmUnits', 'latitude', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      });
    }
    
    if (!tableInfo.longitude) {
      await queryInterface.addColumn('FarmUnits', 'longitude', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      });
    }
    
    if (!tableInfo.geometry) {
      await queryInterface.addColumn('FarmUnits', 'geometry', {
        type: Sequelize.GEOMETRY('POINT', 4326),
        allowNull: true
      });
    }
    
    if (!tableInfo.boundary) {
      await queryInterface.addColumn('FarmUnits', 'boundary', {
        type: Sequelize.GEOMETRY('POLYGON', 4326),
        allowNull: true
      });
    }
    
    // Add NDVI fields
    if (!tableInfo.ndvi_value) {
      await queryInterface.addColumn('FarmUnits', 'ndvi_value', {
        type: Sequelize.DECIMAL(5, 3),
        allowNull: true
      });
    }
    
    if (!tableInfo.ndvi_last_updated) {
      await queryInterface.addColumn('FarmUnits', 'ndvi_last_updated', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    
    if (!tableInfo.crop_health_status) {
      await queryInterface.addColumn('FarmUnits', 'crop_health_status', {
        type: Sequelize.ENUM('excellent', 'good', 'moderate', 'poor', 'critical'),
        allowNull: true
      });
    }
    
    if (!tableInfo.last_satellite_image) {
      await queryInterface.addColumn('FarmUnits', 'last_satellite_image', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Add spatial indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_farm_units_geometry 
      ON "FarmUnits" USING GIST (geometry);
    `);
    
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_farm_units_boundary 
      ON "FarmUnits" USING GIST (boundary);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('FarmUnits', 'latitude');
    await queryInterface.removeColumn('FarmUnits', 'longitude');
    await queryInterface.removeColumn('FarmUnits', 'geometry');
    await queryInterface.removeColumn('FarmUnits', 'boundary');
    await queryInterface.removeColumn('FarmUnits', 'ndvi_value');
    await queryInterface.removeColumn('FarmUnits', 'ndvi_last_updated');
    await queryInterface.removeColumn('FarmUnits', 'crop_health_status');
    await queryInterface.removeColumn('FarmUnits', 'last_satellite_image');
  }
};