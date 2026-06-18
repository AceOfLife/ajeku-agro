// migrations/20260618092247-fix-default-produce-preference-to-string.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Drop the default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" DROP DEFAULT;
    `);

    // Step 2: Change column type to VARCHAR with USING clause
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE VARCHAR(255) USING "default_produce_preference"::text;
    `);

    // Step 3: Set new default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" SET DEFAULT 'sell';
    `);

    // Step 4: Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_default_produce_preference";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate ENUM (for rollback)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_default_produce_preference" AS ENUM('sell', 'take_physical');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE "enum_Users_default_produce_preference" USING "default_produce_preference"::"enum_Users_default_produce_preference";
    `);
  }
};