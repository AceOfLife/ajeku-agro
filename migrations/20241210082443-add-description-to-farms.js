// migrations/20241210082443-add-description-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (!tableDescription.description) {
      await queryInterface.addColumn('Farms', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (tableDescription.description) {
      await queryInterface.removeColumn('Farms', 'description');
    }
  }
};