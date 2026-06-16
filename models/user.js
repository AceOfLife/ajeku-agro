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
      type: DataTypes.ENUM('admin', 'agent', 'client', 'farm_manager', 'investor'),  // Added farm_manager, investor
      defaultValue: 'client',
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
      type: DataTypes.STRING, 
      allowNull: true, 
      validate: {
        isIn: [['male', 'female', 'other']],
      },
    },
    // NEW: Farm-specific user preferences
    default_delivery_region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_produce_preference: {
      type: DataTypes.ENUM('sell', 'take_physical'),
      defaultValue: 'sell',
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
    User.hasMany(models.Farm, {  // was Property
      foreignKey: 'manager_id', 
      as: 'managed_farms' 
    });
    User.hasMany(models.UserDocument, {
      foreignKey: 'userId',
      as: 'documents',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.Investor, {  // was Client
      foreignKey: 'user_id',
      as: 'investor',
      onDelete: 'CASCADE',
      hooks: true
    });
    User.hasOne(models.FarmManager, {  // NEW
      foreignKey: 'user_id',
      as: 'farmManager',
      onDelete: 'CASCADE',
      hooks: true
    });
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
    // NEW: Harvest allocations for this user
    User.hasMany(models.HarvestAllocation, {
      foreignKey: 'investor_id',
      as: 'harvestAllocations'
    });
    // NEW: Produce preferences
    User.hasMany(models.InvestorProducePreference, {
      foreignKey: 'investor_id',
      as: 'producePreferences'
    });
  };

  return User;
};