// migrations/YYYYMMDDHHMMSS-change-size-of-unit-to-string.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('FarmUnits', 'size_of_unit', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('FarmUnits', 'size_of_unit', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  }
};