// migrations/20250630165507-create-user-documents.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUMs with farm document types added
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_UserDocuments_documentType" AS ENUM(
        'DRIVER_LICENSE', 
        'PASSPORT', 
        'NATIONAL_ID',
        'FARM_LICENSE',
        'CERTIFICATE_OF_OCCUPANCY'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_UserDocuments_status" AS ENUM(
        'PENDING', 
        'APPROVED', 
        'REJECTED'
      );
    `);

    await queryInterface.createTable('UserDocuments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        allowNull: false
      },
      documentType: {
        type: '"enum_UserDocuments_documentType"',
        allowNull: false
      },
      frontUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      backUrl: {
        type: Sequelize.STRING
      },
      status: {
        type: '"enum_UserDocuments_status"',
        defaultValue: 'PENDING'
      },
      adminNotes: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('UserDocuments');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_UserDocuments_documentType";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_UserDocuments_status";`);
  }
};