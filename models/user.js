// models/user.js
'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'firstName'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lastName'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contactNumber'
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,  // Changed from ENUM
      defaultValue: 'investor',
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profileImage'
    },
    referralSource: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'referralSource'
    },
    gender: {
      type: DataTypes.STRING,  // Changed from ENUM
      allowNull: true,
    },
    default_delivery_region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_produce_preference: {
      type: DataTypes.STRING,  // Changed from ENUM
      defaultValue: 'sell',
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'Users',
    underscored: false,
    hooks: {
      beforeValidate: (user, options) => {
        if (user.gender) {
          user.gender = user.gender.toLowerCase();
        }
      },
    },
  });

  User.associate = function(models) {
    User.hasMany(models.Transaction, { 
      foreignKey: 'user_id', 
      as: 'transactions' 
    });
    User.hasMany(models.Farm, { 
      foreignKey: 'manager_id', 
      as: 'managed_farms' 
    });
    User.hasMany(models.UserDocument, {
      foreignKey: 'userId',
      as: 'documents',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.Investor, {
      foreignKey: 'user_id',
      as: 'investor',
      onDelete: 'CASCADE',
      hooks: true
    });
    User.hasOne(models.FarmManager, {
      foreignKey: 'user_id',
      as: 'farmManager',
      onDelete: 'CASCADE',
      hooks: true
    });
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
    User.hasMany(models.HarvestAllocation, {
      foreignKey: 'investor_id',
      as: 'harvestAllocations'
    });
    User.hasMany(models.InvestorProducePreference, {
      foreignKey: 'investor_id',
      as: 'producePreferences'
    });
  };

  return User;
};