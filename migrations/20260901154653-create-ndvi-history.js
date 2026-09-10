// migrations/XXXXXXXXXXXXXX-create-ndvi-history.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NDVIHistory', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      farm_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FarmUnits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      ndvi_value: {
        type: Sequelize.DECIMAL(5, 3),
        allowNull: false,
      },
      crop_health_status: {
        type: Sequelize.ENUM('excellent', 'good', 'moderate', 'poor', 'critical'),
        allowNull: true,
      },
      satellite_image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('NDVIHistory');
  }
};