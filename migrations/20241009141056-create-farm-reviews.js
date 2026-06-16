// migrations/20241009141056-create-farm-reviews.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUMs
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_FarmReviews_category" AS ENUM('Crop Quality', 'Harvest Experience', 'Management', 'Communication', 'Returns');
    `);

    await queryInterface.createTable('FarmReviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      investor_id: {  // was client_id
        type: Sequelize.INTEGER,
        references: {
          model: 'Investors',  // was Clients
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      farm_id: {  // was property_id
        type: Sequelize.INTEGER,
        references: {
          model: 'Farms',  // was Properties
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      farm_manager_id: {  // was agent_id
        type: Sequelize.INTEGER,
        references: {
          model: 'FarmManagers',  // was Agents
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {  // ADDED
        type: Sequelize.ENUM('Crop Quality', 'Harvest Experience', 'Management', 'Communication', 'Returns'),
        allowNull: true,
      },
      harvest_cycle_id: {  // ADDED
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'HarvestCycles',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmReviews');
  },
};