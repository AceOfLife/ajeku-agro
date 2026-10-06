module.exports = (sequelize, DataTypes) => {
  const AffiliateProduct = sequelize.define(
    'AffiliateProduct',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      affiliateId: { type: DataTypes.UUID, allowNull: false },
      productId: { type: DataTypes.UUID, allowNull: false },
      commissionPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: { min: 0, max: 100 },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'affiliate_products',
      schema: 'affiliate',
      indexes: [
        {
          unique: true,
          fields: ['affiliate_id', 'product_id'],
          name: 'affiliate_products_unique_affiliate_product',
        },
      ],
    }
  );
  return AffiliateProduct;
};