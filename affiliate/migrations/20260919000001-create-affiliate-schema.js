'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE SCHEMA IF NOT EXISTS "affiliate";'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS "affiliate";');
  },
};