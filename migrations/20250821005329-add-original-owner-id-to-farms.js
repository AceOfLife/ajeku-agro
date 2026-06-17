// migrations/20250821005329-add-original-owner-id-to-farms.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (!tableDescription.original_owner_id) {
      await queryInterface.addColumn('Farms', 'original_owner_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (tableDescription.original_owner_id) {
      await queryInterface.removeColumn('Farms', 'original_owner_id');
    }
  }
};