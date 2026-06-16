// migrations/20241221173804-update-farm-images-image-url-to-array.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add a temporary column with the correct type
    await queryInterface.addColumn('FarmImages', 'new_image_url', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });

    // Copy data from the old `image_url` column to the new column
    await queryInterface.sequelize.query(
      `UPDATE "FarmImages" SET "new_image_url" = ARRAY["image_url"]::text[]`
    );

    // Remove the old column
    await queryInterface.removeColumn('FarmImages', 'image_url');

    // Rename the new column to the original name
    await queryInterface.renameColumn('FarmImages', 'new_image_url', 'image_url');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('FarmImages', 'new_image_url', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.sequelize.query(
      `UPDATE "FarmImages" SET "new_image_url" = "image_url"[1]`
    );

    await queryInterface.removeColumn('FarmImages', 'image_url');
    await queryInterface.renameColumn('FarmImages', 'new_image_url', 'image_url');
  }
};