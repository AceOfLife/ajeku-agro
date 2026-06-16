// models/farmAppointment.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmAppointment = sequelize.define('FarmAppointment', {
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients', // Keep as Clients (investors)
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Farms',  // was Properties
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    appointment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'canceled'),
      allowNull: false,
    },
    // NEW: Farm visit specific fields
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
    FarmAppointment.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
    });
    FarmAppointment.belongsTo(models.Farm, {  // was Property
      foreignKey: 'farm_id',
      as: 'farm',
    });
  };

  return FarmAppointment;
};