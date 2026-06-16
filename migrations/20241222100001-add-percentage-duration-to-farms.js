// migrations/20241222100001-add-percentage-duration-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'percentage', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Farms', 'duration', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'percentage');
    await queryInterface.removeColumn('Farms', 'duration');
  }
};