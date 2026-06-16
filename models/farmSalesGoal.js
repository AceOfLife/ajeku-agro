// models/farmSalesGoal.js (was salesGoal.js)
module.exports = (sequelize, DataTypes) => {
  const FarmSalesGoal = sequelize.define('FarmSalesGoal', {
    month: DataTypes.STRING,
    year: DataTypes.INTEGER,
    goal_farm_units: DataTypes.FLOAT,      // was goal_land
    goal_hectares_acres: DataTypes.FLOAT,  // was goal_building
    goal_investors: DataTypes.FLOAT,       // was goal_rent (new meaning)
    // NEW: Additional farm-specific goals
    goal_harvest_value: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    goal_crops_sold: {
      type: DataTypes.FLOAT,
      allowNull: true,
    }
  }, {});
  return FarmSalesGoal;
};