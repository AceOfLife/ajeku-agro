// migrations/YYYYMMDDHHMMSS-add-default-preference-fields-to-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.default_delivery_region) {
      await queryInterface.addColumn('Users', 'default_delivery_region', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.default_produce_preference) {
      await queryInterface.addColumn('Users', 'default_produce_preference', {
        type: Sequelize.ENUM('sell', 'take_physical'),
        defaultValue: 'sell',
        allowNull: false,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.default_delivery_region) {
      await queryInterface.removeColumn('Users', 'default_delivery_region');
    }
    
    if (tableDescription.default_produce_preference) {
      await queryInterface.removeColumn('Users', 'default_produce_preference');
    }
    
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_Users_default_produce_preference";`);
  }
};