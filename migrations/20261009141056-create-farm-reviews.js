// migrations/20241009141056-create-farm-reviews.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if ENUM exists before creating - using lowercase name
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_farmreviews_category') THEN
          CREATE TYPE "enum_farmreviews_category" AS ENUM('Crop Quality', 'Harvest Experience', 'Management', 'Communication', 'Returns');
        END IF;
      END $$;
    `);

    await queryInterface.createTable('FarmReviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      investor_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Investors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      farm_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Farms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      farm_manager_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'FarmManagers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: "enum_farmreviews_category",
        allowNull: true,
      },
      harvest_cycle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'HarvestCycles',
          key: 'id',
        },
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
    await queryInterface.dropTable('FarmReviews');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_farmreviews_category";`);
  },
};