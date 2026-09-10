// models/NDVIHistory.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const NDVIHistory = sequelize.define('NDVIHistory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ndvi_value: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: false,
    },
    crop_health_status: {
      type: DataTypes.ENUM('excellent', 'good', 'moderate', 'poor', 'critical'),
      allowNull: true,
    },
    satellite_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'NDVIHistory',
    indexes: [
      {
        fields: ['farm_unit_id', 'date'],
        name: 'idx_ndvi_history_unit_date',
      },
    ],
  });

  NDVIHistory.associate = function(models) {
    NDVIHistory.belongsTo(models.FarmUnit, {
      foreignKey: 'farm_unit_id',
      as: 'farmUnit',
    });
  };

  return NDVIHistory;
};