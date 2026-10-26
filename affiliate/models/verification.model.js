module.exports = (sequelize, DataTypes) => {
  const Verification = sequelize.define(
    'Verification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      affiliateId: { type: DataTypes.UUID, allowNull: false },
      saleId: { type: DataTypes.UUID, allowNull: true },
      buyerId: { type: DataTypes.UUID, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      scanCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      firstSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastIp: { type: DataTypes.STRING, allowNull: true },
      lastUserAgent: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'verifications',
      schema: 'affiliate',
      indexes: [
        {
          fields: ['sale_id'],
          name: 'affiliate_verifications_sale_idx',
        },
        {
          fields: ['buyer_id'],
          name: 'affiliate_verifications_buyer_idx',
        },
        {
          unique: true,
          fields: ['sale_id', 'buyer_id'],
          name: 'affiliate_verifications_unique_sale_buyer',
        },
      ],
    }
  );
  return Verification;
};