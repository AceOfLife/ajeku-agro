// models/farmDocument.js
module.exports = (sequelize, DataTypes) => {
    const FarmDocument = sequelize.define('FarmDocument', {
      document_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      document_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // NEW: Document type for organization
      document_type: {
        type: DataTypes.ENUM('Soil Test', 'Water Rights', 'Farm License', 'Insurance', 'Harvest Report', 'Other'),
        allowNull: true,
      },
      upload_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }
    });
  
    FarmDocument.associate = function(models) {
      FarmDocument.belongsTo(models.Farm, {  // was Property
        foreignKey: 'farm_id',  // was property_id
        as: 'farm',
      });
    };
  
    return FarmDocument;
};