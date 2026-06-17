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
      defaultValue: 'acres',
    },
    total_farm_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    crop_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    crop_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    supports_multiple_crops: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    planting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expected_harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    harvest_cycle_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    harvest_status: {
      type: DataTypes.ENUM('Pre-planting', 'Growing', 'Ready for Harvest', 'Harvested'),
      defaultValue: 'Pre-planting',
      allowNull: false,
    },
    expected_yield_per_unit_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    expected_value_per_kg: {
      type: DataTypes.DECIMAL(15, 2),
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
    price_per_unit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_units_available: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    available_units: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_per_slot: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    is_fractional: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    fractional_slots: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    available_slots: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
  });

  Farm.associate = function(models) {
    Farm.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    Farm.hasMany(models.Transaction, { foreignKey: 'farm_id' });
    Farm.hasMany(models.FarmImage, { foreignKey: 'farm_id', as: 'images' });
    Farm.hasMany(models.FarmInstallmentOwnership, { foreignKey: 'farm_id', as: 'installmentOwnerships' });
    Farm.hasMany(models.FarmUnitOwnership, { foreignKey: 'farm_id', as: 'unitOwnerships' });
    Farm.hasMany(models.FullFarmOwnership, { foreignKey: 'farm_id', as: 'fullOwnerships' });
    Farm.hasMany(models.FarmUnit, { foreignKey: 'farm_id', as: 'farmUnits' });
    Farm.hasMany(models.HarvestCycle, { foreignKey: 'farm_id', as: 'harvestCycles' });
    Farm.hasMany(models.InvestorProducePreference, { foreignKey: 'farm_id', as: 'producePreferences' });
  };

  return Farm;
};