// migrations/20250807171319-create-full-farm-ownerships-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FullFarmOwnerships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        allowNull: false
      },
      farm_id: {  // was property_id
        type: Sequelize.INTEGER,
        references: { model: 'Farms', key: 'id' },  // was Properties
        allowNull: false
      },
      units_owned: {  // ADDED
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      purchase_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      purchase_amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('FullFarmOwnerships', ['user_id']);
    await queryInterface.addIndex('FullFarmOwnerships', ['farm_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('FullFarmOwnerships');
  }
};