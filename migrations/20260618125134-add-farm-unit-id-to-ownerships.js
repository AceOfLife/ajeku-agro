// migrations/YYYYMMDDHHMMSS-add-farm-unit-id-to-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnitOwnerships');
    
    // Add farm_unit_id if it doesn't exist
    if (!tableDescription.farm_unit_id) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'farm_unit_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FarmUnits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // Add nft_token_id if it doesn't exist
    if (!tableDescription.nft_token_id) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'nft_token_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add size_purchased if it doesn't exist
    if (!tableDescription.size_purchased) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'size_purchased', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnitOwnerships');
    
    if (tableDescription.farm_unit_id) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'farm_unit_id');
    }
    if (tableDescription.nft_token_id) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'nft_token_id');
    }
    if (tableDescription.size_purchased) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'size_purchased');
    }
  }
};