// migrations/20241009140242-create-investors.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Investors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {  // ADDED: Verification status
        type: Sequelize.ENUM('Unverified', 'Verified'),
        defaultValue: 'Unverified',
        allowNull: false,
      },
      preferred_delivery_region: {  // ADDED: From updated model
        type: Sequelize.STRING,
        allowNull: true,
      },
      default_produce_preference: {  // ADDED: From updated model
        type: Sequelize.ENUM('sell', 'take_physical'),
        defaultValue: 'sell',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Investors');
  },
};