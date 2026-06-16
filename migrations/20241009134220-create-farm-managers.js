// migrations/20241009134220-create-farm-managers.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FarmManagers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      license_number: {  // ADDED
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Farm operation license or certification number',
      },
      years_of_experience: {  // ADDED
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      specialization: {  // ADDED
        type: Sequelize.ENUM('Crop', 'Livestock', 'Mixed', 'Organic'),
        allowNull: true,
      },
      contact_phone: {  // ADDED
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FarmManagers');
  },
};