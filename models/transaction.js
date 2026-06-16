// models/transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    farm_id: {  // was property_id (keep property_id for backward compatibility?)
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Farms', key: 'id' }  // was Properties
    },
    // Keep property_id for backward compatibility during transition
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Properties', key: 'id' }
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.ENUM(
        'full',
        'outright',
        'fractional',
        'fractionalInstallment',
        'installment',
        'rental',
        // NEW: Farm-specific payment types
        'farm_unit',           // Purchase of farm units
        'farm_installment',    // Installment for farm units
        'harvest_payout'       // Harvest revenue distribution
      ),
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    // NEW: Track harvest cycle for harvest payout transactions
    harvest_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'HarvestCycles', key: 'id' }
    },
    // NEW: Track units purchased
    units_purchased: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    }
  }, {
    tableName: 'Transactions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { 
      foreignKey: 'user_id',
      as: 'user'
    });
    Transaction.belongsTo(models.Farm, {  // was Property
      foreignKey: 'farm_id',
      as: 'farm'
    });
    // Keep property association for backward compatibility
    Transaction.belongsTo(models.Property, { 
      foreignKey: 'property_id',
      as: 'property'
    });
    Transaction.belongsTo(models.User, {
      foreignKey: 'client_id',
      as: 'client'
    });
    Transaction.belongsTo(models.HarvestCycle, {
      foreignKey: 'harvest_cycle_id',
      as: 'harvestCycle'
    });
  };

  return Transaction;
};