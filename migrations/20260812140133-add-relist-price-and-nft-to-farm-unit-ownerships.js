// migrations/XXXXXXXXXXXXXX-add-relist-price-and-nft-to-farm-unit-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('FarmUnitOwnerships');
    
    if (!tableInfo.relist_price) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'relist_price', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }
    
    if (!tableInfo.nft_token_id) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'nft_token_id', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('FarmUnitOwnerships', 'relist_price');
    await queryInterface.removeColumn('FarmUnitOwnerships', 'nft_token_id');
  }
};