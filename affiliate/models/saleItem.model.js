module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define(
    'SaleItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      saleId: { type: DataTypes.UUID, allowNull: false },
      affiliateProductId: { type: DataTypes.UUID, allowNull: false },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      grossAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      commissionPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      commissionAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    {
      tableName: 'sale_items',
      schema: 'affiliate',
    }
  );
  return SaleItem;
};