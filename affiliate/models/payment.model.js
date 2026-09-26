module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ref: { type: DataTypes.STRING, allowNull: false, unique: true },
      affiliateId: { type: DataTypes.UUID, allowNull: false },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      paidOn: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('paid', 'pending'),
        allowNull: false,
        defaultValue: 'paid',
      },
      paymentMethod: {
        type: DataTypes.ENUM('bank_transfer', 'cash', 'cheque', 'other'),
        allowNull: true,
      },
      note: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: false },
      updatedBy: { type: DataTypes.UUID, allowNull: true },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
      deletedBy: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: 'payments',
      schema: 'affiliate',
      paranoid: false, // we handle soft-delete manually via deleted_at
    }
  );
  return Payment;
};