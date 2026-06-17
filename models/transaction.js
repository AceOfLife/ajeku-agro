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
    farm_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Farms', key: 'id' }
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
        'farm_unit',
        'farm_installment',
        'harvest_payout'
      ),
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    harvest_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'HarvestCycles', key: 'id' }
    },
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
    Transaction.belongsTo(models.Farm, { 
      foreignKey: 'farm_id',
      as: 'farm'
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