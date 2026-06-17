// models/farmAppointment.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmAppointment = sequelize.define('FarmAppointment', {
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    farm_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'canceled'),
      allowNull: false,
    },
    visit_type: {
      type: DataTypes.ENUM('Site Inspection', 'Harvest Viewing', 'Manager Meeting', 'Due Diligence'),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {});

  FarmAppointment.associate = function(models) {
    FarmAppointment.belongsTo(models.Investor, {
      foreignKey: 'client_id',
      as: 'client',
    });
    FarmAppointment.belongsTo(models.Farm, {
      foreignKey: 'farm_id',
      as: 'farm',
    });
  };

  return FarmAppointment;
};