// migrations/XXXXXXXXXXXXXX-add-spatial-fields-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding
    const tableInfo = await queryInterface.describeTable('Farms');
    
    if (!tableInfo.geometry) {
      await queryInterface.addColumn('Farms', 'geometry', {
        type: Sequelize.GEOMETRY('POINT', 4326),
        allowNull: true
      });
      console.log('✅ Added geometry column');
    }
    
    if (!tableInfo.boundary) {
      await queryInterface.addColumn('Farms', 'boundary', {
        type: Sequelize.GEOMETRY('POLYGON', 4326),
        allowNull: true
      });
      console.log('✅ Added boundary column');
    }

    // Add spatial indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_farms_geometry 
      ON "Farms" USING GIST (geometry);
    `);
    
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_farms_boundary 
      ON "Farms" USING GIST (boundary);
    `);
    
    console.log('✅ Spatial indexes created');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'geometry');
    await queryInterface.removeColumn('Farms', 'boundary');
    console.log('⬇️ Spatial fields removed');
  }
};