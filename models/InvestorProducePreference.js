// models/InvestorProducePreference.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const InvestorProducePreference = sequelize.define('InvestorProducePreference', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    harvest_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'HarvestCycles',
        key: 'id',
      },
      comment: 'NULL means this is the default preference for future cycles',
    },
    preference: {
      type: DataTypes.ENUM('sell', 'take_physical'),
      allowNull: false,
    },
    // For 'take_physical' preference
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    delivery_region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Status tracking
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Locked after preference_lock_date',
    },
    locked_at: {
      type: DataTypes.DATE,
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
    tableName: 'InvestorProducePreferences',
    indexes: [
      {
        unique: true,
        fields: ['investor_id', 'farm_id', 'harvest_cycle_id'],
        name: 'unique_investor_farm_harvest_preference',
      },
    ],
  });

  InvestorProducePreference.associate = function(models) {
    InvestorProducePreference.belongsTo(models.Investor, {
      foreignKey: 'investor_id',
      as: 'investor',
    });
    InvestorProducePreference.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
    InvestorProducePreference.belongsTo(models.HarvestCycle, {
      foreignKey: 'harvest_cycle_id',
      as: 'harvestCycle',
    });
  };

  return InvestorProducePreference;
};