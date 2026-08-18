// migrations/XXXXXXXXXXXXXX-update-produce-preference-enum.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ Step 1: First, drop the default values from columns
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" ALTER COLUMN preference DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" ALTER COLUMN preference_used DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" ALTER COLUMN default_produce_preference DROP DEFAULT;
    `);

    // ✅ Step 2: Convert columns to TEXT first (this preserves existing data)
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" ALTER COLUMN preference TYPE TEXT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" ALTER COLUMN preference_used TYPE TEXT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" ALTER COLUMN default_produce_preference TYPE TEXT;
    `);

    // ✅ Step 3: Now update all 'sell' values to 'doorstep-delivery'
    await queryInterface.sequelize.query(`
      UPDATE "InvestorProducePreferences" 
      SET preference = 'doorstep-delivery' 
      WHERE preference = 'sell';
    `);

    await queryInterface.sequelize.query(`
      UPDATE "HarvestAllocations" 
      SET preference_used = 'doorstep-delivery' 
      WHERE preference_used = 'sell';
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Investors" 
      SET default_produce_preference = 'doorstep-delivery' 
      WHERE default_produce_preference = 'sell';
    `);

    // ✅ Step 4: Drop old ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_InvestorProducePreferences_preference";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_HarvestAllocations_preference_used";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Investors_default_produce_preference";
    `);

    // ✅ Step 5: Create new ENUM types (only 2 values)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_InvestorProducePreferences_preference" AS ENUM('doorstep-delivery', 'take_physical');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestAllocations_preference_used" AS ENUM('doorstep-delivery', 'take_physical');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Investors_default_produce_preference" AS ENUM('doorstep-delivery', 'take_physical');
    `);

    // ✅ Step 6: Convert columns back to ENUM with USING clause
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" 
      ALTER COLUMN preference TYPE "enum_InvestorProducePreferences_preference" 
      USING preference::text::"enum_InvestorProducePreferences_preference";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" 
      ALTER COLUMN preference_used TYPE "enum_HarvestAllocations_preference_used" 
      USING preference_used::text::"enum_HarvestAllocations_preference_used";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" 
      ALTER COLUMN default_produce_preference TYPE "enum_Investors_default_produce_preference" 
      USING default_produce_preference::text::"enum_Investors_default_produce_preference";
    `);

    // ✅ Step 7: Set default values
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" 
      ALTER COLUMN preference SET DEFAULT 'doorstep-delivery';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" 
      ALTER COLUMN preference_used SET DEFAULT 'doorstep-delivery';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" 
      ALTER COLUMN default_produce_preference SET DEFAULT 'doorstep-delivery';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Convert back to 'sell'
    
    // Drop defaults
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" ALTER COLUMN preference DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" ALTER COLUMN preference_used DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" ALTER COLUMN default_produce_preference DROP DEFAULT;
    `);

    // Convert to TEXT
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" ALTER COLUMN preference TYPE TEXT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" ALTER COLUMN preference_used TYPE TEXT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" ALTER COLUMN default_produce_preference TYPE TEXT;
    `);

    // Update all 'doorstep-delivery' to 'sell'
    await queryInterface.sequelize.query(`
      UPDATE "InvestorProducePreferences" 
      SET preference = 'sell' 
      WHERE preference = 'doorstep-delivery';
    `);

    await queryInterface.sequelize.query(`
      UPDATE "HarvestAllocations" 
      SET preference_used = 'sell' 
      WHERE preference_used = 'doorstep-delivery';
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Investors" 
      SET default_produce_preference = 'sell' 
      WHERE default_produce_preference = 'doorstep-delivery';
    `);

    // Drop new ENUMs
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_InvestorProducePreferences_preference";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_HarvestAllocations_preference_used";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Investors_default_produce_preference";
    `);

    // Create old ENUMs with 'sell'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_InvestorProducePreferences_preference" AS ENUM('sell', 'take_physical');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_HarvestAllocations_preference_used" AS ENUM('sell', 'take_physical');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Investors_default_produce_preference" AS ENUM('sell', 'take_physical');
    `);

    // Convert back to ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE "InvestorProducePreferences" 
      ALTER COLUMN preference TYPE "enum_InvestorProducePreferences_preference" 
      USING preference::text::"enum_InvestorProducePreferences_preference";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "HarvestAllocations" 
      ALTER COLUMN preference_used TYPE "enum_HarvestAllocations_preference_used" 
      USING preference_used::text::"enum_HarvestAllocations_preference_used";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Investors" 
      ALTER COLUMN default_produce_preference TYPE "enum_Investors_default_produce_preference" 
      USING default_produce_preference::text::"enum_Investors_default_produce_preference";
    `);
  }
};