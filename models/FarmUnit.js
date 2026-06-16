// models/FarmUnit.js
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
      allowNull: true,
      comment: 'Optional identifier for the unit (e.g., "Plot A", "Section 1")',
    },
    size_in_unit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Size of this unit in the farm\'s measurement unit',
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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
      comment: 'NFT deed token ID',
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