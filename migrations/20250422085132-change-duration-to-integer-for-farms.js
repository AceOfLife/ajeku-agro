// migrations/20250422085132-change-duration-to-integer-for-farms.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Convert empty strings to NULL
    await queryInterface.sequelize.query(`
      UPDATE "Farms"
      SET "duration" = NULL
      WHERE TRIM("duration") = '';
    `);

    // Change the column type
    await queryInterface.sequelize.query(`
      ALTER TABLE "Farms"
      ALTER COLUMN "duration" TYPE INTEGER USING "duration"::INTEGER;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Farms"
      ALTER COLUMN "duration" TYPE VARCHAR(255);
    `);
  }
};