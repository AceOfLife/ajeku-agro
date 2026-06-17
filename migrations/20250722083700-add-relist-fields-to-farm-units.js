// migrations/20250722083700-add-relist-fields-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const farmUnitTable = await queryInterface.describeTable('FarmUnitOwnerships');
    const farmsTable = await queryInterface.describeTable('Farms');

    // Add relist fields to FarmUnitOwnerships
    if (!farmUnitTable.is_relisted) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'is_relisted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    if (!farmUnitTable.relist_price) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'relist_price', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }

    // Add relist fields to Farms
    if (!farmsTable.is_relisted) {
      await queryInterface.addColumn('Farms', 'is_relisted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    if (!farmsTable.original_owner_id) {
      await queryInterface.addColumn('Farms', 'original_owner_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface) => {
    const farmUnitTable = await queryInterface.describeTable('FarmUnitOwnerships');
    const farmsTable = await queryInterface.describeTable('Farms');

    if (farmUnitTable.is_relisted) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'is_relisted');
    }
    if (farmUnitTable.relist_price) {
      await queryInterface.removeColumn('FarmUnitOwnerships', 'relist_price');
    }
    if (farmsTable.is_relisted) {
      await queryInterface.removeColumn('Farms', 'is_relisted');
    }
    if (farmsTable.original_owner_id) {
      await queryInterface.removeColumn('Farms', 'original_owner_id');
    }
  }
};