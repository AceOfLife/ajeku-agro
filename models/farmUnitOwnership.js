// models/farmUnitOwnership.js
module.exports = (sequelize, DataTypes) => {
    const FarmUnitOwnership = sequelize.define('FarmUnitOwnership', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      farm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Farms',
          key: 'id',
        },
      },
      farm_unit_id: {  // ✅ ADD THIS: Link to specific unit
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'FarmUnits',
          key: 'id',
        },
      },
      transaction_id: {  // ✅ ADD THIS: Link to transaction
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Transactions',
          key: 'id',
        },
      },
      units_purchased: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      size_purchased: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      purchase_amount: {  // ✅ ADD THIS: Amount paid for this unit
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      purchase_date: {  // ✅ ADD THIS: When the unit was purchased
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      is_relisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      relist_price: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      nft_token_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  
    FarmUnitOwnership.associate = (models) => {
      FarmUnitOwnership.belongsTo(models.User, { 
        foreignKey: 'user_id',
        as: 'user' 
      });
      FarmUnitOwnership.belongsTo(models.Farm, { 
        foreignKey: 'farm_id',
        as: 'farm' 
      });
      FarmUnitOwnership.belongsTo(models.FarmUnit, { 
        foreignKey: 'farm_unit_id',
        as: 'farmUnit' 
      });
      FarmUnitOwnership.belongsTo(models.Transaction, { 
        foreignKey: 'transaction_id',
        as: 'transaction' 
      });
      FarmUnitOwnership.hasMany(models.InvestorProducePreference, {
        foreignKey: 'farm_unit_ownership_id',
        as: 'producePreferences',
      });
    };
  
    return FarmUnitOwnership;
};