// models/HarvestCycle.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const HarvestCycle = sequelize.define('HarvestCycle', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    farm_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Farms',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    cycle_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1st, 2nd, 3rd harvest for this farm',
    },
    harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    preference_lock_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Investors cannot change produce preference after this date',
    },
    // Harvest results (filled after harvest)
    actual_yield_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Total actual harvest in kilograms',
    },
    actual_market_price_per_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Market price at harvest time',
    },
    platform_fee_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Percentage deducted from sell proceeds',
    },
    // Status tracking
    status: {
      type: DataTypes.ENUM('upcoming', 'preferences_locked', 'harvested', 'distributing', 'completed'),
      defaultValue: 'upcoming',
      allowNull: false,
    },
    // Timestamps
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'HarvestCycles',
  });

  HarvestCycle.associate = function(models) {
    HarvestCycle.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
    HarvestCycle.hasMany(models.HarvestAllocation, {
      foreignKey: 'harvest_cycle_id',
      as: 'allocations',
    });
    HarvestCycle.hasMany(models.InvestorProducePreference, {
      foreignKey: 'harvest_cycle_id',
      as: 'producePreferences',
    });
  };

  return HarvestCycle;
};