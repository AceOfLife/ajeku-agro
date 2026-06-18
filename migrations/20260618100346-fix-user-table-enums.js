// migrations/YYYYMMDDHHMMSS-fix-user-table-enums.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if enum exists and fix role column
    const roleEnumCheck = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role'
    `);
    
    if (roleEnumCheck[0].length > 0) {
      // Remove default value
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT;
      `);
      
      // Convert to VARCHAR
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" TYPE VARCHAR(255) USING "role"::text;
      `);
      
      // Set new default
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'client';
      `);
      
      // Drop the ENUM
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_role";
      `);
    }

    // Fix gender column if it's ENUM
    const genderEnumCheck = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_Users_gender'
    `);
    
    if (genderEnumCheck[0].length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "gender" TYPE VARCHAR(255) USING "gender"::text;
      `);
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_gender";
      `);
    }

    // Fix default_produce_preference if it's still ENUM
    const prefEnumCheck = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_Users_default_produce_preference'
    `);
    
    if (prefEnumCheck[0].length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" DROP DEFAULT;
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE VARCHAR(255) USING "default_produce_preference"::text;
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" SET DEFAULT 'sell';
      `);
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_default_produce_preference";
      `);
    }

    console.log('✅ User table ENUMs fixed successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate ENUMs (for rollback if needed)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('admin', 'agent', 'client', 'farm_manager', 'investor');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "role" TYPE "enum_Users_role" USING "role"::"enum_Users_role";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'client';
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_gender" AS ENUM('male', 'female', 'other');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "gender" TYPE "enum_Users_gender" USING "gender"::"enum_Users_gender";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_default_produce_preference" AS ENUM('sell', 'take_physical');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE "enum_Users_default_produce_preference" USING "default_produce_preference"::"enum_Users_default_produce_preference";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" SET DEFAULT 'sell';
    `);
  }
};