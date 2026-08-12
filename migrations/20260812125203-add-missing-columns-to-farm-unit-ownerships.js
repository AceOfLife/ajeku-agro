// migrations/XXXXXXXXXXXXXX-add-missing-columns-to-farm-unit-ownerships.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add farm_unit_id
    const tableInfo = await queryInterface.describeTable('FarmUnitOwnerships');
    
    if (!tableInfo.farm_unit_id) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'farm_unit_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FarmUnits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableInfo.size_purchased) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'size_purchased', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    if (!tableInfo.purchase_amount) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'purchase_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      });
    }

    if (!tableInfo.purchase_date) {
      await queryInterface.addColumn('FarmUnitOwnerships', 'purchase_date', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      });
    }

    // Add index
    await queryInterface.addIndex('FarmUnitOwnerships', ['farm_unit_id'], {
      name: 'idx_farm_unit_ownerships_farm_unit_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('FarmUnitOwnerships', 'farm_unit_id');
    await queryInterface.removeColumn('FarmUnitOwnerships', 'size_purchased');
    await queryInterface.removeColumn('FarmUnitOwnerships', 'purchase_amount');
    await queryInterface.removeColumn('FarmUnitOwnerships', 'purchase_date');
  }
};