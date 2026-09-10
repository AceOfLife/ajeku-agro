// migrations/XXXXXXXXXXXXXX-enable-postgis.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable PostGIS extension
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS postgis_topology;`);
    console.log('✅ PostGIS extensions enabled');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS postgis_topology;`);
    await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS postgis;`);
    console.log('⬇️ PostGIS extensions removed');
  }
};