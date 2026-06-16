// models/investor.js (was clients.js)
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Investor = sequelize.define('Investor', {
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
    status: {
      type: DataTypes.ENUM('Unverified', 'Verified'),
      defaultValue: 'Unverified',
      allowNull: false,
    },
    // NEW: Investor-specific fields
    preferred_delivery_region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_produce_preference: {
      type: DataTypes.ENUM('sell', 'take_physical'),
      defaultValue: 'sell',
    },
  }, {
    tableName: 'Investors',  // was Clients
    underscored: false,
  });

  Investor.associate = function(models) {
    Investor.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    // Add relationship to produce preferences
    Investor.hasMany(models.InvestorProducePreference, {
      foreignKey: 'investor_id',
      as: 'producePreferences',
    });
  };

  return Investor;
};