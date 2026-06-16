// models/HarvestAllocation.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const HarvestAllocation = sequelize.define('HarvestAllocation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    harvest_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'HarvestCycles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    investor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Investors',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    farm_unit_ownership_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'FarmUnitOwnerships',
        key: 'id',
      },
    },
    preference_used: {
      type: DataTypes.ENUM('sell', 'take_physical'),
      allowNull: false,
      comment: 'Which option the investor chose for this harvest',
    },
    allocated_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Kilograms allocated to this investor',
    },
    // For 'sell' investors
    payout_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Gross payout before fees',
    },
    platform_fee_deducted: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    net_payout: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    payout_status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed'),
      defaultValue: 'pending',
    },
    payout_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payout_reference: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction reference for payout',
    },
    // For 'take_physical' investors
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    delivery_region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    delivery_status: {
      type: DataTypes.ENUM('pending', 'dispatched', 'delivered', 'failed'),
      defaultValue: 'pending',
    },
    dispatch_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logistics_cost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
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
    tableName: 'HarvestAllocations',
  });

  HarvestAllocation.associate = function(models) {
    HarvestAllocation.belongsTo(models.HarvestCycle, {
      foreignKey: 'harvest_cycle_id',
      as: 'harvestCycle',
    });
    HarvestAllocation.belongsTo(models.Investor, {
      foreignKey: 'investor_id',
      as: 'investor',
    });
    HarvestAllocation.belongsTo(models.FarmUnitOwnership, {
      foreignKey: 'farm_unit_ownership_id',
      as: 'ownership',
    });
  };

  return HarvestAllocation;
};