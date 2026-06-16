// migrations/20250808100449-add-is-sold-out-to-farms.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Farms', 'is_sold_out', {  // was is_sold
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if all farm units are sold/fully subscribed'
    });

    await queryInterface.sequelize.query(
      'UPDATE "Farms" SET is_sold_out = false WHERE is_sold_out IS NULL;'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Farms', 'is_sold_out');
  }
};