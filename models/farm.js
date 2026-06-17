// ==================== ASSOCIATIONS ====================
Farm.associate = function (models) {
  // Each farm belongs to a user (farm manager)
  Farm.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });

  // Each farm can have many transactions
  Farm.hasMany(models.Transaction, { foreignKey: 'farm_id' });

  // Each farm can have many images
  Farm.hasMany(models.FarmImage, {
    foreignKey: 'farm_id',
    as: 'images',
  });

  // Farm ownership associations
  Farm.hasMany(models.FarmInstallmentOwnership, {
    foreignKey: 'farm_id',
    as: 'installmentOwnerships',
  });

  Farm.hasMany(models.FarmUnitOwnership, {
    foreignKey: 'farm_id',
    as: 'unitOwnerships',
  });

  Farm.hasMany(models.FullFarmOwnership, {
    foreignKey: 'farm_id',
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