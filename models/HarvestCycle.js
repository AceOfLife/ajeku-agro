// models/HarvestCycle.js
module.exports = (sequelize, DataTypes) => {
  const HarvestCycle = sequelize.define('HarvestCycle', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // ✅ ADD THIS: Link to specific unit
    farm_unit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'FarmUnits',
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
    cycle_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Harvest cycle number for this unit (1, 2, 3...)',
    },
    harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    preference_lock_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'preferences_locked', 'harvested', 'distributing', 'completed'),
      defaultValue: 'upcoming',
    },
    actual_yield_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    actual_market_price_per_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    platform_fee_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10.00,
    },
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
    indexes: [
      {
        unique: true,
        fields: ['farm_unit_id', 'cycle_number'],
        name: 'unique_unit_cycle',
      },
    ],
  });

  HarvestCycle.associate = function(models) {
    HarvestCycle.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
    HarvestCycle.belongsTo(models.FarmUnit, {
      foreignKey: 'farm_unit_id',
      as: 'unit',  
    });
    HarvestCycle.hasMany(models.HarvestAllocation, {
      foreignKey: 'harvest_cycle_id',
      as: 'allocations',
    });
  };

  return HarvestCycle;
};