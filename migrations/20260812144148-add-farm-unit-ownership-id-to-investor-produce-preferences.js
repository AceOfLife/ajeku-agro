// migrations/XXXXXXXXXXXXXX-add-farm-unit-ownership-id-to-investor-produce-preferences.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('InvestorProducePreferences');
    
    if (!tableInfo.farm_unit_ownership_id) {
      await queryInterface.addColumn('InvestorProducePreferences', 'farm_unit_ownership_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FarmUnitOwnerships',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added farm_unit_ownership_id column to InvestorProducePreferences');
    } else {
      console.log('ℹ️ farm_unit_ownership_id column already exists');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('InvestorProducePreferences', 'farm_unit_ownership_id');
    console.log('⬇️ Removed farm_unit_ownership_id column from InvestorProducePreferences');
  }
};