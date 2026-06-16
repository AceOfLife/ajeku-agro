// migrations/20250619150145-create-farm-sales-goals.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmSalesGoals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      goal_farm_units: {  // was goal_land
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      goal_hectares_acres: {  // was goal_building
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      goal_investors: {  // was goal_rent
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      goal_harvest_value: {  // ADDED
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      goal_crops_sold: {  // ADDED
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmSalesGoals');
  }
};