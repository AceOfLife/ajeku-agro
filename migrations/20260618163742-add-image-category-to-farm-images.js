// migrations/YYYYMMDDHHMMSS-add-image-category-to-farm-images.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmImages');
    
    if (!tableDescription.image_category) {
      await queryInterface.addColumn('FarmImages', 'image_category', {
        type: Sequelize.ENUM('Aerial', 'Soil', 'Crop', 'Infrastructure', 'Harvest', 'General'),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmImages');
    if (tableDescription.image_category) {
      await queryInterface.removeColumn('FarmImages', 'image_category');
    }
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_FarmImages_image_category";`);
  }
};