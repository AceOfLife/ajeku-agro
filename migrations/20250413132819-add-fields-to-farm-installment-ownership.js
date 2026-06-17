// migrations/20250413132819-add-fields-to-farm-installment-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmInstallmentOwnerships');
    
    if (!tableDescription.total_months) {
      await queryInterface.addColumn('FarmInstallmentOwnerships', 'total_months', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    if (!tableDescription.months_paid) {
      await queryInterface.addColumn('FarmInstallmentOwnerships', 'months_paid', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    if (!tableDescription.status) {
      await queryInterface.addColumn('FarmInstallmentOwnerships', 'status', {
        type: Sequelize.ENUM('ongoing', 'completed'),
        allowNull: false,
        defaultValue: 'ongoing'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('FarmInstallmentOwnerships');
    
    if (tableDescription.total_months) {
      await queryInterface.removeColumn('FarmInstallmentOwnerships', 'total_months');
    }
    if (tableDescription.months_paid) {
      await queryInterface.removeColumn('FarmInstallmentOwnerships', 'months_paid');
    }
    if (tableDescription.status) {
      await queryInterface.removeColumn('FarmInstallmentOwnerships', 'status');
    }
  }
};