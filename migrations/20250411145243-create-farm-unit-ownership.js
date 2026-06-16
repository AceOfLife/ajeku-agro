// migrations/20250411145243-create-farm-unit-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmUnitOwnerships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      farm_id: {  // was property_id
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Farms',  // was Properties
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      units_purchased: {  // was slots_purchased
        type: Sequelize.DECIMAL(10, 2),  // Changed to DECIMAL for fractional units
        allowNull: false,
      },
      size_purchased: {  // NEW
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total size in farm\'s measurement unit',
      },
      is_relisted: {  // ADDED
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      relist_price: {  // ADDED
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      nft_token_id: {  // ADDED
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'NFT deed token ID',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmUnitOwnerships');
  }
};