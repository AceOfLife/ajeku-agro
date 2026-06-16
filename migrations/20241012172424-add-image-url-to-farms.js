// migrations/20241012172424-add-image-url-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add to Farms table instead of Properties
    await queryInterface.addColumn('Farms', 'cover_image_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'cover_image_url');
  }
};