// models/farmInstallmentOwnership.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const FarmInstallmentOwnership = sequelize.define('FarmInstallmentOwnership', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    total_months: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    months_paid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM("ongoing", "completed"),
      allowNull: false,
      defaultValue: "ongoing"
    },
    // NEW: Track which harvest cycles the investor participates in during installment
    participates_in_harvest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "From PDF section 8 - whether investor gets harvest proceeds during installment"
    }
  }, {});

  FarmInstallmentOwnership.associate = function(models) {
    FarmInstallmentOwnership.belongsTo(models.User, { foreignKey: 'user_id' });
    FarmInstallmentOwnership.belongsTo(models.Farm, { foreignKey: 'farm_id', as: 'farm' });  // was Property
    FarmInstallmentOwnership.hasMany(models.FarmInstallmentPayment, { foreignKey: 'ownership_id' });
  };

  return FarmInstallmentOwnership;
};