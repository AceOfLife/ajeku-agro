// migrations/YYYYMMDDHHMMSS-add-lat-long-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    if (!tableDescription.latitude) {
      await queryInterface.addColumn('Farms', 'latitude', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    }

    if (!tableDescription.longitude) {
      await queryInterface.addColumn('Farms', 'longitude', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    if (tableDescription.latitude) {
      await queryInterface.removeColumn('Farms', 'latitude');
    }
    if (tableDescription.longitude) {
      await queryInterface.removeColumn('Farms', 'longitude');
    }
  }
};