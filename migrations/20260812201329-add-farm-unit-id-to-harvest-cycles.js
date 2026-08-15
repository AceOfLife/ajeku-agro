// migrations/XXXXXXXXXXXXXX-add-farm-unit-id-to-harvest-cycles.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('HarvestCycles');
    
    // ✅ Step 1: Add the column as nullable first
    if (!tableInfo.farm_unit_id) {
      await queryInterface.addColumn('HarvestCycles', 'farm_unit_id', {
        type: Sequelize.INTEGER,
        allowNull: true,  // ← Allow NULL temporarily
        references: {
          model: 'FarmUnits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      console.log('✅ Added farm_unit_id column (nullable)');
    }

    // ✅ Step 2: Populate farm_unit_id from existing FarmUnit records
    // For each harvest cycle, find a farm unit belonging to the same farm
    const [results] = await queryInterface.sequelize.query(`
      UPDATE "HarvestCycles" hc
      SET farm_unit_id = (
        SELECT id FROM "FarmUnits" fu 
        WHERE fu.farm_id = hc.farm_id 
        LIMIT 1
      )
      WHERE hc.farm_unit_id IS NULL
    `);
    console.log('✅ Populated farm_unit_id for existing records');

    // ✅ Step 3: Make the column NOT NULL
    await queryInterface.changeColumn('HarvestCycles', 'farm_unit_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'FarmUnits',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    console.log('✅ Made farm_unit_id NOT NULL');

    // ✅ Step 4: Add unique constraint
    await queryInterface.addConstraint('HarvestCycles', {
      fields: ['farm_unit_id', 'cycle_number'],
      type: 'unique',
      name: 'unique_unit_cycle'
    });
    console.log('✅ Added unique constraint');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('HarvestCycles', 'unique_unit_cycle');
    await queryInterface.removeColumn('HarvestCycles', 'farm_unit_id');
    console.log('⬇️ Reverted changes');
  }
};