// migrations/20250615000004-create-farm-units.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM for unit status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_FarmUnits_status" AS ENUM('available', 'reserved', 'sold');
    `);

    await queryInterface.createTable('FarmUnits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      farm_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Farms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      unit_number: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Optional identifier for the unit (e.g., "Plot A", "Section 1")',
      },
      size_in_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Size of this unit in the farm\'s measurement unit',
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('available', 'reserved', 'sold'),
        defaultValue: 'available',
      },
      current_owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      nft_token_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'NFT deed token ID',
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

    // Add indexes
    await queryInterface.addIndex('FarmUnits', ['farm_id']);
    await queryInterface.addIndex('FarmUnits', ['status']);
    await queryInterface.addIndex('FarmUnits', ['current_owner_id']);
    await queryInterface.addIndex('FarmUnits', ['nft_token_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FarmUnits');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_FarmUnits_status";`);
  },
};