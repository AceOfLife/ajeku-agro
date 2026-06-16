// migrations/20250611094904-add-isFractionalDuration-to-farms.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Farms", "isFractionalDuration", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Farms", "isFractionalDuration");
  }
};