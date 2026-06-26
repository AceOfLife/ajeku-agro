// models/farm.js
module.exports = (sequelize, DataTypes) => {
  const Farm = sequelize.define('Farm', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gps_coordinates: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    measurement_unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'hectares',
    },
    total_farm_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    farm_valuation: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    farm_manager: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
    },
    soil_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    irrigation_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    physical_delivery_offered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    delivery_regions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    is_fractional: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isInstallment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isFractionalInstallment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isFractionalDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    percentage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_sold_out: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_relisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    original_owner_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: true,
    },
    monthly_expense: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  });

  Farm.associate = function(models) {
    Farm.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    Farm.hasMany(models.Transaction, { foreignKey: 'farm_id' });
    Farm.hasMany(models.FarmImage, { foreignKey: 'farm_id', as: 'images' });
    Farm.hasMany(models.FarmInstallmentOwnership, { foreignKey: 'farm_id', as: 'installmentOwnerships' });
    Farm.hasMany(models.FarmUnitOwnership, { foreignKey: 'farm_id', as: 'unitOwnerships' });
    Farm.hasMany(models.FullFarmOwnership, { foreignKey: 'farm_id', as: 'fullOwnerships' });
    Farm.hasMany(models.FarmUnit, { foreignKey: 'farm_id', as: 'units' });
    Farm.hasMany(models.HarvestCycle, { foreignKey: 'farm_id', as: 'harvestCycles' });
    Farm.hasMany(models.InvestorProducePreference, { foreignKey: 'farm_id', as: 'producePreferences' });
  };

  return Farm;
};