// migrations/XXXXXXXXXXXXXX-add-media-fields-to-messages.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Messages', 'media_type', {
      type: Sequelize.ENUM('image', 'document', 'pdf', 'other'),
      allowNull: true
    });

    await queryInterface.addColumn('Messages', 'media_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Messages', 'media_filename', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Messages', 'cloudinary_public_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Messages', 'media_type');
    await queryInterface.removeColumn('Messages', 'media_url');
    await queryInterface.removeColumn('Messages', 'media_filename');
    await queryInterface.removeColumn('Messages', 'cloudinary_public_id');
    
    // Drop the enum type as well
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_media_type"');
  }
};