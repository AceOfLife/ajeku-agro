// migrations/20250904175151-add-media-fields-to-messages.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Messages');
    
    if (!tableDescription.media_type) {
      await queryInterface.addColumn('Messages', 'media_type', {
        type: Sequelize.ENUM('image', 'document', 'pdf', 'other'),
        allowNull: true
      });
    }

    if (!tableDescription.media_url) {
      await queryInterface.addColumn('Messages', 'media_url', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDescription.media_filename) {
      await queryInterface.addColumn('Messages', 'media_filename', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDescription.cloudinary_public_id) {
      await queryInterface.addColumn('Messages', 'cloudinary_public_id', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Messages');
    
    if (tableDescription.media_type) {
      await queryInterface.removeColumn('Messages', 'media_type');
    }
    if (tableDescription.media_url) {
      await queryInterface.removeColumn('Messages', 'media_url');
    }
    if (tableDescription.media_filename) {
      await queryInterface.removeColumn('Messages', 'media_filename');
    }
    if (tableDescription.cloudinary_public_id) {
      await queryInterface.removeColumn('Messages', 'cloudinary_public_id');
    }
    
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_media_type"');
  }
};