// models/farm.js
module.exports = (sequelize, DataTypes) => {
  const Farm = sequelize.define('Farm', {
    // ==================== BASIC FARM INFORMATION ====================
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
      type: DataTypes.STRING, // Format: "lat,lng"
      allowNull: true,
    },

    // ==================== FARM SIZE & MEASUREMENT (NEW) ====================
    measurement_unit: {
      type: DataTypes.STRING, // "acres", "hectares", "plots", "sq meters"
      allowNull: false,
      defaultValue: 'acres',
    },
    total_farm_size: {
      type: DataTypes.DECIMAL(10, 2), // Total size in measurement_unit
      allowNull: false,
    },
    unit_size: {
      type: DataTypes.DECIMAL(10, 2), // Size per investable unit (e.g., 1 acre)
      allowNull: false,
    },

    // ==================== CROP INFORMATION (NEW) ====================
    crop_type: {
      type: DataTypes.STRING, // "Ginger" (primary crop at launch)
      allowNull: false,
    },
    crop_description: {
      type: DataTypes.TEXT, // Variety, quality, farming method
      allowNull: true,
    },
    supports_multiple_crops: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // For Phase 1 - single crop
    },

    // ==================== HARVEST INFORMATION (NEW) ====================
    planting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expected_harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    harvest_cycle_months: {
      type: DataTypes.INTEGER, // 9 months for ginger
      allowNull: false,
    },
    harvest_status: {
      type: DataTypes.ENUM('Pre-planting', 'Growing', 'Ready for Harvest', 'Harvested'),
      defaultValue: 'Pre-planting',
      allowNull: false,
    },

    // ==================== YIELD & FINANCIALS (NEW) ====================
    expected_yield_per_unit_kg: {
      type: DataTypes.DECIMAL(10, 2), // Kilograms per investable unit
      allowNull: false,
    },
    expected_value_per_kg: {
      type: DataTypes.DECIMAL(15, 2), // Estimated market rate at harvest (in Naira)
      allowNull: false,
    },
    farm_valuation: {
      type: DataTypes.DECIMAL(15, 2), // Total farm valuation (replaces estimated_value)
      allowNull: true,
    },

    // ==================== FARM OPERATIONS (NEW) ====================
    farm_manager: {
      type: DataTypes.STRING, // Person or organisation operating the farm
      allowNull: false,
    },
    manager_id: { // Renamed from agent_id
      type: DataTypes.INTEGER,
      references: {
        model: 'Users', // Reference to the User model (farm managers are Users)
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

    // ==================== PRODUCE DELIVERY (NEW) ====================
    physical_delivery_offered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    delivery_regions: {
      type: DataTypes.ARRAY(DataTypes.STRING), // List of states/regions
      allowNull: true,
    },

    // ==================== PRICING & UNITS (Adapted from property) ====================
    price_per_unit: { // Renamed from 'price'
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_units_available: { // Renamed from 'fractional_slots' (more farm-appropriate)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    available_units: { // Renamed from 'available_slots'
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_per_slot: { // Kept for compatibility, but deprecated in favor of price_per_unit
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    // ==================== FRACTIONAL OWNERSHIP (Carried over) ====================
    is_fractional: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Farms are inherently fractional
      allowNull: false,
    },
    fractional_slots: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Deprecated - use total_units_available instead',
    },
    available_slots: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Deprecated - use available_units instead',
    },

    // ==================== INSTALLMENT PLANS (Carried over) ====================
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

    // ==================== FARM STATUS & METRICS ====================
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_sold_out: { // Renamed from 'is_sold' - farms don't get "sold", they get fully subscribed
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

    // ==================== REMOVED FIELDS (from property) ====================
    // The following fields from property.js are NOT included in Farm:
    // - annual_rent (replaced by harvest value)
    // - monthly_expense (farm operating costs handled separately)
    // - type (property type like Rooms/Workspace - replaced by crop_type)
    // - area (replaced by total_farm_size)
    // - number_of_baths (not applicable)
    // - number_of_rooms (not applicable)
    // - payment_plan (handled via installment fields)
    // - year_built (not applicable)
    // - special_features (replaced by crop_description)
    // - isRental (not applicable for farms)
    // - listed_by (replaced by farm_manager)
    // - kitchen, heating, cooling, appliances, features (not applicable)
    // - interior_area, parking, lot, type_and_style, material (not applicable)
    // - annual_tax_amount, date_on_market, ownership (not applicable for farms)
    // - rental_rooms (not applicable)
    // - market_value (replaced by farm_valuation)
  });

  // ==================== ASSOCIATIONS ====================
  Farm.associate = function (models) {
    // Each farm belongs to a user (farm manager)
    Farm.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });

    // Each farm can have many transactions
    Farm.hasMany(models.Transaction, { foreignKey: 'property_id' }); // Note: Keep property_id for backward compatibility

    // Each farm can have many images
    Farm.hasMany(models.PropertyImage, {
      foreignKey: 'property_id',
      as: 'images',
    });

    // Farm ownership associations
    Farm.hasMany(models.InstallmentOwnership, {
      foreignKey: 'property_id',
      as: 'installmentOwnerships',
    });

    Farm.hasMany(models.FractionalOwnership, {
      foreignKey: 'property_id',
      as: 'fractionalOwnerships',
    });

    Farm.hasMany(models.FullOwnership, {
      foreignKey: 'property_id',
      as: 'fullOwnerships',
    });

    // NEW ASSOCIATIONS for Agriculture
    Farm.hasMany(models.FarmUnit, {
      foreignKey: 'farm_id',
      as: 'farmUnits',
    });

    Farm.hasMany(models.HarvestCycle, {
      foreignKey: 'farm_id',
      as: 'harvestCycles',
    });

    Farm.hasMany(models.InvestorProducePreference, {
      foreignKey: 'farm_id',
      as: 'producePreferences',
    });
  };

  return Farm;
};