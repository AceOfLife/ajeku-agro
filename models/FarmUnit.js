// models/farmUnit.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmUnit = sequelize.define('FarmUnit', {
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
    unit_number: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., "Unit A1", "Plot 1"',
    },
    size_in_unit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Size of this unit in hectares',
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    crop_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Crop grown on this specific unit',
    },
    crop_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Variety, quality, farming method for this unit',
    },
    planting_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expected_harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    harvest_cycle_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expected_yield_per_unit_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    expected_value_per_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'reserved', 'sold'),
      defaultValue: 'available',
    },
    current_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    nft_token_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'NFT deed token ID for this unit',
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
    tableName: 'FarmUnits',
  });

  FarmUnit.associate = function(models) {
    FarmUnit.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
    FarmUnit.belongsTo(models.User, {
      foreignKey: 'current_owner_id',
      as: 'currentOwner',
    });
    FarmUnit.hasMany(models.FarmUnitOwnership, {
      foreignKey: 'farm_unit_id',
      as: 'ownershipHistory',
    });
  };

  return FarmUnit;
};