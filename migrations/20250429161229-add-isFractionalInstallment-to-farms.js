// migrations/20250429161229-add-isFractionalInstallment-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'isFractionalInstallment', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'isFractionalInstallment');
  }
};