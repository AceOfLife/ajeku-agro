// migrations/20250722083700-add-relist-fields-to-farm-units.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add relist fields to FarmUnitOwnerships (was FractionalOwnerships)
    await queryInterface.addColumn('FarmUnitOwnerships', 'is_relisted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('FarmUnitOwnerships', 'relist_price', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // Add relist fields to Farms (was Properties)
    await queryInterface.addColumn('Farms', 'is_relisted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

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
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('FarmUnitOwnerships', 'is_relisted');
    await queryInterface.removeColumn('FarmUnitOwnerships', 'relist_price');
    await queryInterface.removeColumn('Farms', 'is_relisted');
    await queryInterface.removeColumn('Farms', 'original_owner_id');
  }
};