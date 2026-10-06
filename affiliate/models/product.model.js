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
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
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