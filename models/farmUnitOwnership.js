// models/farmUnitOwnership.js (was fractionalOwnership.js)
module.exports = (sequelize, DataTypes) => {
    const FarmUnitOwnership = sequelize.define('FarmUnitOwnership', {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      farm_id: {  // was property_id
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Farms',  // was Properties
          key: 'id',
        },
      },
      units_purchased: {  // was slots_purchased
        type: DataTypes.DECIMAL(10, 2),  // Changed to DECIMAL for fractional units
        allowNull: false,
      },
      size_purchased: {  // NEW: total size in farm's measurement unit
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      is_relisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      relist_price: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      nft_token_id: {  // NEW: NFT deed reference
        type: DataTypes.STRING,
        allowNull: true,
      },
    });
  
    FarmUnitOwnership.associate = (models) => {
      FarmUnitOwnership.belongsTo(models.User, { foreignKey: 'user_id' });
      FarmUnitOwnership.belongsTo(models.Farm, { foreignKey: 'farm_id' });  // was Property
      // NEW: Link to produce preferences
      FarmUnitOwnership.hasMany(models.InvestorProducePreference, {
        foreignKey: 'farm_unit_ownership_id',
        as: 'producePreferences',
      });
    };
  
    return FarmUnitOwnership;
};