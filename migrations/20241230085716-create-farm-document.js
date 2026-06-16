// migrations/20241230085716-create-farm-document.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmDocuments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      farm_id: {  // was property_id
        type: Sequelize.INTEGER,
        references: {
          model: 'Farms',  // was Properties
          key: 'id',
        },
        allowNull: false,
      },
      document_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      document_name: {  // ADDED: from updated model
        type: Sequelize.STRING,
        allowNull: true,
      },
      document_type: {  // ADDED: from updated model
        type: Sequelize.ENUM('Soil Test', 'Water Rights', 'Farm License', 'Insurance', 'Harvest Report', 'Other'),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmDocuments');
  }
};