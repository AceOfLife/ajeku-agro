module.exports = (sequelize, DataTypes) => {
  const Buyer = sequelize.define(
    'Buyer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      affiliateId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      buyerToken: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      scanCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      firstSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'buyers',
      schema: 'affiliate',
      indexes: [
        {
          unique: true,
          fields: ['affiliate_id', 'email'],
          name: 'affiliate_buyers_unique_affiliate_email',
        },
      ],
    }
  );
  return Buyer;
};