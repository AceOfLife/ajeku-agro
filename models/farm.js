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
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: 'Latitude coordinate of the farm',
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: 'Longitude coordinate of the farm',
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
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cover image URL for the farm',
    },
    soil_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    irrigation_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    delivery_regions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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