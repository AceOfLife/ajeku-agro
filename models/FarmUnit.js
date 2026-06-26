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
    size_of_unit: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Size of this unit (e.g., "5 hectares", "2 acres")',
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    crop_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    crop_description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    soil_type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Soil type for this specific unit',
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Image URL for this specific unit',
    },
    gps_coordinates: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'GPS coordinates for this specific unit',
    },
    irrigation_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Irrigation method for this specific unit',
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