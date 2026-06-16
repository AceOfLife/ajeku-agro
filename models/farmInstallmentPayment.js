// models/farmInstallmentPayment.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const FarmInstallmentPayment = sequelize.define('FarmInstallmentPayment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ownership_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_paid: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    payment_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // NEW: Payment method tracking
    payment_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {});

  FarmInstallmentPayment.associate = function(models) {
    FarmInstallmentPayment.belongsTo(models.User, { foreignKey: 'user_id' });
    FarmInstallmentPayment.belongsTo(models.Farm, { foreignKey: 'farm_id' });  // was Property
    FarmInstallmentPayment.belongsTo(models.FarmInstallmentOwnership, { foreignKey: 'ownership_id' });
  };

  return FarmInstallmentPayment;
};