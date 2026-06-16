// migrations/20250413132819-add-fields-to-farm-installment-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('FarmInstallmentOwnerships', 'total_months', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    await queryInterface.addColumn('FarmInstallmentOwnerships', 'months_paid', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('FarmInstallmentOwnerships', 'status', {
      type: Sequelize.ENUM('ongoing', 'completed'),
      allowNull: false,
      defaultValue: 'ongoing'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('FarmInstallmentOwnerships', 'total_months');
    await queryInterface.removeColumn('FarmInstallmentOwnerships', 'months_paid');
    await queryInterface.removeColumn('FarmInstallmentOwnerships', 'status');
  }
};