// migrations/YYYYMMDDHHMMSS-add-delivery-region-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    if (!tableDescription.delivery_region) {
      await queryInterface.addColumn('FarmUnits', 'delivery_region', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Delivery region for this specific unit',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmUnits');
    
    if (tableDescription.delivery_region) {
      await queryInterface.removeColumn('FarmUnits', 'delivery_region');
    }
  }
};