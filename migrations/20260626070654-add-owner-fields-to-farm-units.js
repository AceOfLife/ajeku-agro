// migrations/YYYYMMDDHHMMSS-add-owner-fields-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    if (!tableDescription.current_owner_id) {
      await queryInterface.addColumn('FarmUnits', 'current_owner_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!tableDescription.nft_token_id) {
      await queryInterface.addColumn('FarmUnits', 'nft_token_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    if (tableDescription.current_owner_id) {
      await queryInterface.removeColumn('FarmUnits', 'current_owner_id');
    }
    if (tableDescription.nft_token_id) {
      await queryInterface.removeColumn('FarmUnits', 'nft_token_id');
    }
  }
};