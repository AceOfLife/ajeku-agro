module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define(
    'Sale',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ref: { type: DataTypes.STRING, allowNull: false, unique: true },
      productId: { type: DataTypes.UUID, allowNull: false },
      affiliateId: { type: DataTypes.UUID, allowNull: false },        // commission owner
      loggedByUserId: { type: DataTypes.UUID, allowNull: false },     // worker or partner
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      grossAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      commissionPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      commissionAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'sales',
      schema: 'affiliate',
    }
  );
  return Sale;
};