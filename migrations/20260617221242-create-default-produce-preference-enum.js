// migrations/YYYYMMDDHHMMSS-create-default-produce-preference-enum.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if ENUM exists before creating then dropping it
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_default_produce_preference') THEN
          CREATE TYPE "enum_Users_default_produce_preference" AS ENUM('sell', 'take_physical');
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_Users_default_produce_preference";`);
  }
};