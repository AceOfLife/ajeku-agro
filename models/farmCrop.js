// models/farmCrop.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmCrop = sequelize.define('FarmCrop', {
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
    crop_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of crop (e.g., Ginger, Turmeric, Cassava)',
    },
    crop_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Variety, quality, farming method',
    },
    area_allocated: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Area allocated to this crop in the farm\'s measurement unit',
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
      comment: 'Months until harvest for this specific crop',
    },
    expected_yield_per_unit_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Expected yield per investable unit for this crop',
    },
    expected_value_per_kg: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Expected market value per kg for this crop',
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is the primary crop of the farm',
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
    tableName: 'FarmCrops',
  });

  FarmCrop.associate = function(models) {
    FarmCrop.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
  };

  return FarmCrop;
};