// migrations/20241223222039-add-investor-profile-fields.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Investors', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Investors', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Investors', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Investors', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Investors', 'address');
    await queryInterface.removeColumn('Investors', 'phone_number');
    await queryInterface.removeColumn('Investors', 'city');
    await queryInterface.removeColumn('Investors', 'state');
  }
};