// models/farmReview.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmReview = sequelize.define('FarmReview', {
    investor_id: {  // was client_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Investors',  // was Clients
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Farms',  // was Properties
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    farm_manager_id: {  // was agent_id
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'FarmManagers',  // was Agents
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // NEW: Review categories specific to farms
    category: {
      type: DataTypes.ENUM('Crop Quality', 'Harvest Experience', 'Management', 'Communication', 'Returns'),
      allowNull: true,
    },
    harvest_cycle_id: {  // NEW: Link review to specific harvest
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'HarvestCycles',
        key: 'id',
      },
    },
  }, {});

  FarmReview.associate = function(models) {
    FarmReview.belongsTo(models.Investor, {  // was Client
      foreignKey: 'investor_id',
      as: 'investor',
    });
    FarmReview.belongsTo(models.Farm, {  // was Property
      foreignKey: 'farm_id',
      as: 'farm',
    });
    FarmReview.belongsTo(models.FarmManager, {  // was Agent
      foreignKey: 'farm_manager_id',
      as: 'farmManager',
    });
    FarmReview.belongsTo(models.HarvestCycle, {
      foreignKey: 'harvest_cycle_id',
      as: 'harvestCycle',
    });
  };

  return FarmReview;
};