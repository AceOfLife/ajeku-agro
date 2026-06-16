// models/farmImage.js (was propertyImage.js)
module.exports = (sequelize, DataTypes) => {
  const FarmImage = sequelize.define('FarmImage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Farms',  // was Properties
        key: 'id',
      },
    },
    image_url: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    // NEW: Image categorization
    image_category: {
      type: DataTypes.ENUM('Aerial', 'Soil', 'Crop', 'Infrastructure', 'Harvest', 'General'),
      allowNull: true,
    }
  }, {
    timestamps: true,
  });

  FarmImage.associate = (models) => {
    FarmImage.belongsTo(models.Farm, {  // was Property
      foreignKey: 'farm_id',
      as: 'farm',
    });
  };

  return FarmImage;
};