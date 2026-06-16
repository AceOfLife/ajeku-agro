'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'gender', {
      type: Sequelize.STRING, // You can use STRING or ENUM depending on your preference
      allowNull: true, // Set to false if you want to make it required
      validate: {
        isIn: [['male', 'female', 'other']], // You can restrict to these 3 options, or make it flexible
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'gender');
  },
};
