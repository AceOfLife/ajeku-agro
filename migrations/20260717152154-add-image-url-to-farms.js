// migrations/YYYYMMDDHHMMSS-add-image-url-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    if (!tableDescription.image_url) {
      await queryInterface.addColumn('Farms', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Cover image URL for the farm',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    
    if (tableDescription.image_url) {
      await queryInterface.removeColumn('Farms', 'image_url');
    }
  }
};