// migrations/20241012172424-add-image-url-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('Farms');
    if (!tableDescription.cover_image_url) {
      await queryInterface.addColumn('Farms', 'cover_image_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (tableDescription.cover_image_url) {
      await queryInterface.removeColumn('Farms', 'cover_image_url');
    }
  }
};