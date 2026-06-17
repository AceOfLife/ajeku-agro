// migrations/20250821005010-add-is-relisted-to-farms.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (!tableDescription.is_relisted) {
      await queryInterface.addColumn('Farms', 'is_relisted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Farms');
    if (tableDescription.is_relisted) {
      await queryInterface.removeColumn('Farms', 'is_relisted');
    }
  }
};