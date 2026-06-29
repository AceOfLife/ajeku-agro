// migrations/YYYYMMDDHHMMSS-update-farm-manager-specializations.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing ENUM and recreate with new values
    await queryInterface.sequelize.query(`
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" DROP DEFAULT;
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" TYPE VARCHAR(255) USING "specialization"::text;
      DROP TYPE IF EXISTS "enum_FarmManagers_specialization";
      CREATE TYPE "enum_FarmManagers_specialization" AS ENUM('Crop', 'Weeding', 'Mixed', 'Security');
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" TYPE "enum_FarmManagers_specialization" USING "specialization"::"enum_FarmManagers_specialization";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" DROP DEFAULT;
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" TYPE VARCHAR(255) USING "specialization"::text;
      DROP TYPE IF EXISTS "enum_FarmManagers_specialization";
      CREATE TYPE "enum_FarmManagers_specialization" AS ENUM('Crop', 'Livestock', 'Mixed', 'Organic');
      ALTER TABLE "FarmManagers" ALTER COLUMN "specialization" TYPE "enum_FarmManagers_specialization" USING "specialization"::"enum_FarmManagers_specialization";
    `);
  }
};