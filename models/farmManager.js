// models/farmManager.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmManager = sequelize.define('FarmManager', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    license_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Farm operation license or certification number',
    },
    // NEW: Farm-specific fields
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    specialization: {
      type: DataTypes.ENUM('Crop', 'Livestock', 'Mixed', 'Organic'),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {});

  FarmManager.associate = function(models) {
    FarmManager.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    // Farms managed by this farm manager (was properties)
    FarmManager.hasMany(models.Farm, {
      foreignKey: 'manager_id',
      as: 'farms',
    });
  };

  return FarmManager;
};