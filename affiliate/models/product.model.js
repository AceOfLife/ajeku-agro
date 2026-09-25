module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
      imageUrls: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      commissionPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: { min: 0, max: 100 },
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdBy: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: 'products',
      schema: 'affiliate',
    }
  );
  return Product;
};