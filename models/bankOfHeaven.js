module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BankOfHeaven', {
    current_balance: DataTypes.DECIMAL(15, 2),
    income_per_month: DataTypes.DECIMAL(15, 2),
    expenses_per_month: DataTypes.DECIMAL(15, 2),
    transactions: DataTypes.JSONB,
    // Add these new fields
    previous_month_data: {
      type: DataTypes.JSONB,
      defaultValue: {
        income: 0,
        expenses: 0,
        balance: 0
      }
    },
    percentage_changes: {
      type: DataTypes.JSONB,
      defaultValue: {
        income: 0,
        expenses: 0,
        balance: 0
      }
    }
  }, {
    tableName: 'BankOfHeaven',
    timestamps: true
  });
};